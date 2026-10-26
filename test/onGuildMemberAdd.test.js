const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "src", "handlers", "onGuildMemberAdd.js"),
  "utf8"
);

function setup(settings, { sendError, failedRoleId, missingChannel = false } = {}) {
  const sent = [];
  const assigned = [];
  const errors = [];
  const moduleMock = { exports: {} };
  const channel = {
    isTextBased: () => true,
    async send(message) {
      sent.push(message);
      if (sendError) throw sendError;
    },
  };
  const member = {
    guild: {
      id: "guild",
      channels: { cache: new Map(missingChannel ? [] : [["welcome", channel]]) },
    },
    user: { tag: "new-member" },
    roles: {
      async add(roleId) {
        assigned.push(roleId);
        if (roleId === failedRoleId) throw new Error("Missing Permissions");
      },
    },
  };
  vm.runInNewContext(source, {
    module: moduleMock,
    require(name) {
      assert.equal(name, "../store/guildSettings");
      return {
        getGuildSettings(guildId) {
          assert.equal(guildId, member.guild.id);
          return settings;
        },
      };
    },
    console: { log() {}, error: (...args) => errors.push(args) },
  });
  return { run: () => moduleMock.exports()(member), sent, assigned, errors };
}

test("sends the welcome message and assigns all configured roles", async () => {
  const context = setup({ welcomeChannelId: "welcome", welcomeRoleIds: ["one", "two"] });
  await context.run();
  assert.equal(context.sent.length, 1);
  assert.deepEqual(context.assigned, ["one", "two"]);
  assert.equal(context.errors.length, 0);
});

test("logs welcome send failures and still assigns roles", async () => {
  const sendError = new Error("Missing Access");
  const context = setup(
    { welcomeChannelId: "welcome", welcomeRoleIds: ["one", "two"] },
    { sendError }
  );
  await context.run();
  assert.deepEqual(context.assigned, ["one", "two"]);
  assert.equal(context.errors.length, 1);
  assert.equal(context.errors[0][1], sendError);
  assert.match(context.errors[0][0], /channelId=welcome user=new-member/);
});

test("assigns roles without a configured welcome channel", async () => {
  const context = setup({ welcomeRoleIds: ["one"] });
  await context.run();
  assert.deepEqual(context.assigned, ["one"]);
  assert.equal(context.sent.length, 0);
});

test("assigns roles when the welcome channel is missing from the cache", async () => {
  const context = setup(
    { welcomeChannelId: "welcome", welcomeRoleIds: ["one"] },
    { missingChannel: true }
  );
  await context.run();
  assert.deepEqual(context.assigned, ["one"]);
});

test("continues assigning remaining roles after one role fails", async () => {
  const context = setup({ welcomeRoleIds: ["one", "two"] }, { failedRoleId: "one" });
  await context.run();
  assert.deepEqual(context.assigned, ["one", "two"]);
  assert.equal(context.errors.length, 1);
  assert.match(context.errors[0][0], /roleId=one/);
});

test("sends the welcome message when no roles are configured", async () => {
  const context = setup({ welcomeChannelId: "welcome" });
  await context.run();
  assert.equal(context.sent.length, 1);
  assert.deepEqual(context.assigned, []);
});
