const getConfig = (): Config => {
  const data: Config = {
    clientId: process.env.DISCORD_CLIENT_ID as string,
    scope: process.env.DISCORD_SCOPE as string,
    allowRoles: (process.env.DISCORD_ALLOW_ROLES as string).split(','),
    guildId: process.env.DISCORD_GUILD_ID as string,
    discordToken: process.env.DISCORD_TOKEN as string,
    port: Number(process.env.PORT as string),
  };

  if (!data.clientId) {
    throw new Error('The environment variable DISCORD_CLIENT_ID is not specified.');
  }

  if (!data.scope) {
    throw new Error('The environment variable DISCORD_SCOPE is not specified.');
  }

  if (!data.allowRoles) {
    throw new Error('The environment variable DISCORD_ALLOW_ROLES is not specified.');
  }

  if (!data.guildId) {
    throw new Error('The environment variable DISCORD_GUILD_ID is not specified.');
  }

  if (!data.discordToken) {
    throw new Error('The environment variable DISCORD_TOKEN is not specified.');
  }

  if (!data.port) {
    throw new Error('The environment variable PORT is not specified.');
  }

  return data;
};

export default getConfig();
