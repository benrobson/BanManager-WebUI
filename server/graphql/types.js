const { gql } = require('apollo-server-koa')
const { EOL } = require('os')
const { tables } = require('../data/tables')
const tableTypes = Object.keys(tables).map(table => `${table}: String`).join(EOL)
const tableTypesRequired = Object.keys(tables).map(table => `${table}: String!`).join(EOL)

/* eslint max-len: 0 */
module.exports = gql`

scalar IPAddress
scalar Timestamp
scalar UUID
scalar JSONObject

directive @allowIf(resource: String!, permission: String!, serverVar: String, serverSrc: String) on FIELD_DEFINITION
directive @allowIfLoggedIn on FIELD_DEFINITION
directive @sqlRelation(field: String!, table: String!, joinType: String, joinOn: String, whereKey: String) on FIELD_DEFINITION
directive @sqlTable(name: String!) on OBJECT
directive @sqlColumn(name: String!) on FIELD_DEFINITION
directive @constraint(
  minLength: Int
  maxLength: Int
  startsWith: String
  endsWith: String
  notContains: String
  pattern: String
  format: String

  min: Int
  max: Int
  exclusiveMin: Int
  exclusiveMax: Int
  multipleOf: Int
) on INPUT_FIELD_DEFINITION

type Server @sqlTable(name: "servers") @cacheControl(scope: PUBLIC, maxAge: 3600) {
  id: ID! @cacheControl(scope: PUBLIC, maxAge: 3600)
  name: String! @cacheControl(scope: PUBLIC, maxAge: 3600)
  host: String! @allowIf(resource: "servers", permission: "manage")
  port: Int! @allowIf(resource: "servers", permission: "manage")
  database: String! @allowIf(resource: "servers", permission: "manage")
  user: String! @allowIf(resource: "servers", permission: "manage")
  console: Player! @allowIf(resource: "servers", permission: "manage")
  tables: ServerTables! @allowIf(resource: "servers", permission: "manage")
  timeOffset: Timestamp! @cacheControl(scope: PUBLIC, maxAge: 3600)
}

type ServerTables {
  ${tableTypes}
}

type EntityACL {
  create: Boolean!
  update: Boolean!
  delete: Boolean!
  actor: Boolean!
  yours: Boolean!
}

type Player @sqlTable(name: "players") {
  id: UUID! @cacheControl(scope: PUBLIC, maxAge: 3600)
  name: String! @cacheControl(scope: PUBLIC, maxAge: 3600)
  ip: IPAddress @allowIf(resource: "player.ips", permission: "view")
  lastSeen: Timestamp! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type User @sqlTable(name: "users") {
  id: UUID! @sqlColumn(name: "player_id")
  email: String @allowIf(resource: "servers", permission: "manage")
  roles: [UserRole!]! @allowIf(resource: "servers", permission: "manage") @sqlRelation(joinOn: "id", field: "player_id", whereKey: "player_id", table: "playerRoles", joinType: "leftJoin")
  serverRoles: [UserServerRole!]! @allowIf(resource: "servers", permission: "manage") @sqlRelation(joinOn: "id", field: "player_id", whereKey: "player_id", table: "playerServerRoles", joinType: "leftJoin")
  player: Player
}

type UserRole @sqlTable(name: "playerRoles") {
  role: Role! @sqlRelation(joinOn: "role_id", field: "role_id", table: "roles")
}

type UserServerRole @sqlTable(name: "playerServerRoles") {
  serverRole: Role! @sqlRelation(joinOn: "role_id", field: "role_id", table: "roles")
  server: Server! @sqlRelation(joinOn: "id", field: "server_id", table: "servers")
}

type UserList {
  total: Int!
  records: [User!]
}

type PlayerBan @sqlTable(name: "playerBans") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  acl: EntityACL!
}

type PlayerKick @sqlTable(name: "playerKicks") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  acl: EntityACL!
}

type PlayerSessionHistory @sqlTable(name: "playerHistory") {
  id: ID!
  ip: IPAddress! @allowIf(resource: "player.ips", permission: "view")
  join: Timestamp!
  leave: Timestamp!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
}

type PlayerMute @sqlTable(name: "playerMutes") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  soft: Boolean!
  acl: EntityACL!
}

type PlayerNote @sqlTable(name: "playerNotes") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  message: String!
  created: Timestamp!
  acl: EntityACL!
}

type PlayerReportList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerReport!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerBanList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerBan!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerMuteList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerMute!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerWarningList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerWarning!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerSessionHistoryList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerSessionHistory!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerReport @sqlTable(name: "playerReports") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  assignee: Player @sqlRelation(joinOn: "id", field: "assignee_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  state: PlayerReportState! @sqlRelation(joinOn: "id", field: "state_id", table: "playerReportStates")
  playerLocation: PlayerReportLocation @sqlRelation(joinOn: "player_id", field: "player_id", table: "playerReportLocations", joinType: "leftJoin")
  actorLocation: PlayerReportLocation @sqlRelation(joinOn: "player_id", field: "actor_id", table: "playerReportLocations", joinType: "leftJoin")
  acl: PlayerReportACL!
  serverLogs: [PlayerReportServerLog!] @sqlRelation(field: "id", table: "playerReportLogs", whereKey: "report_id") @allowIf(resource: "player.reports", permission: "view.serverlogs", serverSrc: "id")
  commands: [PlayerReportCommand!]  @sqlRelation(field: "id", table: "playerReportCommands", whereKey: "report_id") @allowIf(resource: "player.reports", permission: "view.commands", serverSrc: "id")
}

type PlayerReportACL {
  state: Boolean!
  comment: Boolean!
  assign: Boolean!
  delete: Boolean!
}

type PlayerReportCommand @sqlTable(name: "playerReportCommands") {
  id: ID!
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players")
  command: String!
  args: String
  created: Timestamp!
  updated: Timestamp!
}

type PlayerReportLocation @sqlTable(name: "playerReportLocations") {
  world: String!
  x: Float!
  y: Float!
  z: Float!
  yaw: Float!
  pitch: Float!
}

type PlayerReportComment @sqlTable(name: "playerReportComments") {
  id: ID!
  comment: String!
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players")
  created: Timestamp!
  updated: Timestamp!
  acl: EntityACL!
}

type PlayerReportServerLog @sqlTable(name: "playerReportLogs") {
  id: ID!
  log: ServerLog! @sqlRelation(joinOn: "id", field: "log_id", table: "serverLogs")
}

type ServerLog {
  id: ID!
  message: String!
  created: Timestamp!
}

type PlayerReportState @sqlTable(name: "playerReportStates") {
  id: ID!
  name: String!
}

type EntityTypeACL {
  create: Boolean!
  update: Boolean!
  delete: Boolean!
}

type PlayerWarning @sqlTable(name: "playerWarnings") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  read: Boolean!
  points: Float!
  acl: EntityACL!
}

type Me {
  id: UUID!
  name: String!
  email: String!
  hasAccount: Boolean!
  session: PlayerSession!
}

type PlayerSession {
  type: String!
}

type MenuItem {
  id: ID!
  name: String!
  href: String
}

type AdminMenuItem {
  id: ID!
  name: String!
  href: String
  label: Int
}

type Navigation @cacheControl(scope: PRIVATE, maxAge: 300) {
  left: [MenuItem!]! @cacheControl(scope: PRIVATE, maxAge: 300)
}

type AdminNavigation {
  left: [AdminMenuItem!]!
}

type Role @sqlTable(name: "roles") {
  id: ID! @sqlColumn(name: "role_id")
  name: String!
  parent: ID
  resources: [Resources!]
}

type Resources {
  id: ID!
  name: String!
  permissions: [Permission]
}

type Permission {
  id: ID!
  name: String!
  allowed: Boolean!
}

enum RecordType {
  PlayerBan
  PlayerKick
  PlayerMute
  PlayerNote
  PlayerWarning
}

enum OrderByInput {
  created_ASC
  created_DESC
}

enum OrderBySessionHistoryInput {
  leave_ASC
  leave_DESC
  join_ASC
  join_DESC
}

type DeviceComponent {
  id: ID!
  component: String!
  x: Int!
  y: Int!
  w: Int!
  colour: String
  textAlign: String
  meta: JSONObject
}

type ReusableDeviceComponent {
  component: String!
  x: Int
  y: Int
  w: Int
  colour: String
  textAlign: String
  meta: JSONObject
}

type PageDevice {
  components: [DeviceComponent!]! @cacheControl(scope: PUBLIC, maxAge: 300)
  unusedComponents: [DeviceComponent!]! @allowIf(resource: "servers", permission: "manage")
  reusableComponents: [ReusableDeviceComponent!]! @allowIf(resource: "servers", permission: "manage")
}

type PageDevices {
  mobile: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
  tablet: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
  desktop: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PageLayout @cacheControl(scope: PUBLIC, maxAge: 300) {
  pathname: ID! @cacheControl(scope: PUBLIC, maxAge: 300)
  devices: PageDevices! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type Query {
  searchPlayers(name: String!, limit: Int = 10): [Player!]
  listUsers(player: UUID, email: String, role: String, serverRole: String, limit: Int = 10, offset: Int = 0): UserList @allowIf(resource: "servers", permission: "manage")

  servers: [Server!]
  serverTables: [String!]
  server(id: ID!): Server

  playerBan(id: ID!, serverId: ID!): PlayerBan @allowIf(resource: "player.bans", permission: "view", serverVar: "serverId")
  listPlayerBans(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerBanList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.bans", permission: "view")

  playerKick(id: ID!, serverId: ID!): PlayerKick @allowIf(resource: "player.kicks", permission: "view", serverVar: "serverId")

  playerMute(id: ID!, serverId: ID!): PlayerMute @allowIf(resource: "player.mutes", permission: "view", serverVar: "serverId")
  listPlayerMutes(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerMuteList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.mutes", permission: "view")

  playerNote(id: ID!, serverId: ID!): PlayerNote @allowIf(resource: "player.notes", permission: "view", serverVar: "serverId")

  playerWarning(id: ID!, serverId: ID!): PlayerWarning @allowIf(resource: "player.warnings", permission: "view", serverVar: "serverId")
  listPlayerWarnings(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerWarningList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.warnings", permission: "view")

  me: Me

  navigation: Navigation!
  adminNavigation: AdminNavigation! @allowIf(resource: "servers", permission: "manage")

  pageLayout(pathname: String!): PageLayout!
  pageLayouts: [PageLayout!] @allowIf(resource: "servers", permission: "manage")

  roles(defaultOnly: Boolean): [Role!] @allowIf(resource: "servers", permission: "manage")
  role(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  resources: [Resources!] @allowIf(resource: "servers", permission: "manage")

  reportStates(serverId: ID!): [PlayerReportState!]
  report(id: ID!, serverId: ID!): PlayerReport
  listPlayerReports(serverId: ID!, actor: UUID, assigned: UUID, player: UUID, state: ID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerReportList! @cacheControl(scope: PRIVATE, maxAge: 300)

  reportComment(id: ID!, serverId: ID!): PlayerReportComment! @allowIf(resource: "player.reports", permission: "view.comments", serverVar: "serverId")

  listPlayerSessionHistory(serverId: ID!, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderBySessionHistoryInput): PlayerSessionHistoryList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.history", permission: "view")

}

input CreatePlayerNoteInput {
  player: UUID!
  message: String @constraint(maxLength: 255)
  server: ID!
}

input UpdatePlayerNoteInput {
  message: String! @constraint(maxLength: 255)
}

input CreatePlayerBanInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  server: ID!
}

input UpdatePlayerBanInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
}

input CreatePlayerMuteInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  soft: Boolean!
  server: ID!
}

input UpdatePlayerMuteInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  soft: Boolean!
}

input CreatePlayerWarningInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  server: ID!
  points: Float!
}

input UpdatePlayerWarningInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  points: Float!
}


input CreateServerInput {
  name: String! @constraint(maxLength: 20)
  host: String! @constraint(maxLength: 255)
  port: Int!
  database: String! @constraint(maxLength: 255)
  user: String! @constraint(maxLength: 255)
  password: String
  console: UUID!
  tables: ServerTablesInput!
}

input UpdateServerInput {
  name: String! @constraint(maxLength: 20)
  host: String! @constraint(maxLength: 255)
  port: Int!
  database: String! @constraint(maxLength: 255)
  user: String! @constraint(maxLength: 255)
  password: String
  console: UUID!
  tables: ServerTablesInput!
}

input ServerTablesInput {
  ${tableTypesRequired}
}

input UpdateRoleInput {
  name: String! @constraint(maxLength: 20)
  parent: ID
  resources: [ResourceInput!]!
}

input ResourceInput {
  id: ID!
  name: String!
  permissions: [PermissionInput!]!
}

input PermissionInput {
  id: ID!
  name: String!
  allowed: Boolean!
}

input ReportCommentInput {
  comment: String! @constraint(maxLength: 255)
}

input UpdatePageLayoutInput {
  mobile: PageLayoutDeviceInput!
  tablet: PageLayoutDeviceInput!
  desktop: PageLayoutDeviceInput!
}

input PageLayoutDeviceInput {
  components: [PageLayoutComponentInput!]!
  unusedComponents: [PageLayoutComponentInput!]!
}

input PageLayoutComponentInput {
  id: ID
  component: String!
  x: Int!
  y: Int!
  w: Int!
  colour: String
  textAlign: String
  meta: JSONObject
}

input RoleInput {
  id: ID!
}

input ServerInput {
  id: ID!
}

input ServerRoleInput {
  role: RoleInput!
  server: ServerInput!
}

input SetRolesInput {
  roles: [RoleInput!]!
  serverRoles: [ServerRoleInput!]!
}

type Mutation {
  deletePunishmentRecord(id: ID!, serverId: ID!, type: RecordType!, keepHistory: Boolean!): ID!

  createPlayerNote(input: CreatePlayerNoteInput!): PlayerNote @allowIf(resource: "player.notes", permission: "create", serverVar: "input.server")
  updatePlayerNote(id: ID!, serverId: ID!, input: UpdatePlayerNoteInput!): PlayerNote @allowIf(resource: "player.notes", permission: "update.any", serverVar: "serverId")
  deletePlayerNote(id: ID!, serverId: ID!): PlayerNote @allowIfLoggedIn

  createPlayerBan(input: CreatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "create", serverVar: "input.server")
  updatePlayerBan(id: ID!, serverId: ID!, input: UpdatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "update.any", serverVar: "serverId")
  deletePlayerBan(id: ID!, serverId: ID!): PlayerBan @allowIfLoggedIn

  createPlayerMute(input: CreatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "create", serverVar: "input.server")
  updatePlayerMute(id: ID!, serverId: ID!, input: UpdatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "update.any", serverVar: "serverId")
  deletePlayerMute(id: ID!, serverId: ID!): PlayerMute @allowIfLoggedIn

  createPlayerWarning(input: CreatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "create", serverVar: "input.server")
  updatePlayerWarning(id: ID!, serverId: ID!, input: UpdatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "update.any", serverVar: "serverId")
  deletePlayerWarning(id: ID!, serverId: ID!): PlayerWarning @allowIfLoggedIn

  deletePlayerKick(id: ID!, serverId: ID!): PlayerKick @allowIfLoggedIn

  createServer(input: CreateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  updateServer(id: ID!, input: UpdateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  deleteServer(id: ID!): ID! @allowIf(resource: "servers", permission: "manage")

  createRole(input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  updateRole(id: ID!, input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  deleteRole(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  assignRole(players: [UUID!]!, role: Int!): Role! @allowIf(resource: "servers", permission: "manage")
  assignServerRole(players: [UUID!], role: Int!, serverId: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  setRoles(player: UUID!, input: SetRolesInput!): User! @allowIf(resource: "servers", permission: "manage")

  assignReport(report: ID!, serverId: ID!, player: UUID!): PlayerReport! @allowIfLoggedIn
  reportState(report: ID!, serverId: ID!, state: ID!): PlayerReport! @allowIfLoggedIn
  deleteReportComment(id: ID!, serverId: ID!): PlayerReportComment! @allowIfLoggedIn
  createReportComment(report: ID!, serverId: ID!, input: ReportCommentInput!): PlayerReportComment! @allowIfLoggedIn

  setPassword(currentPassword: String, newPassword: String!): Me! @allowIfLoggedIn
  setEmail(currentPassword: String!, email: String!): Me! @allowIfLoggedIn

  updatePageLayout(pathname: ID!, input: UpdatePageLayoutInput!): PageLayout @allowIf(resource: "servers", permission: "manage")
}`
