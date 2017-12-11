import {createSelector} from "reselect"
import _ from "lodash/fp"
import Maps from "./maps.json"
import Links from "./map-links.json"
const mapValues = _.mapValues.convert({cap: false})

const rawMaps = createSelector(
  () => Maps,
  mapValues((map, name) => ({name, ...map})),
)
const links = () => Links
const linksByName = createSelector(rawMaps, links, (maps, list) => {
  const byName = mapValues(() => [], maps)
  for (let [a, b] of list) {
    if (byName[a])
      // TODO replace with assert
      byName[a] = byName[a].concat(b)
    if (byName[b])
      // TODO replace with assert
      byName[b] = byName[b].concat(a)
  }
  return byName
})

const vendorsFromByName = createSelector(rawMaps, maps => {
  const byName = mapValues(() => [], maps)
  for (let map of _.values(maps)) {
    const {vendor, name} = map
    if (byName[vendor])
      // TODO replace with assert
      byName[vendor] = byName[vendor].concat(name)
  }
  return byName
})
const nameProp = (s, p) => p.name
export const vendorsFrom = createSelector(
  vendorsFromByName,
  nameProp,
  (vs, n) => vs[n],
)
const dropsFromAll = createSelector(linksByName, nameProp, (ls, n) => ls[n])
const map = createSelector(rawMaps, nameProp, (ms, n) => ms[n])
const mapProp = _.memoize(f => createSelector(map, _.get(f)))
export const mapTier = mapProp("tier")
// maps this can drop from with zero completion, excluding higher-tier maps.
export const dropsFrom = createSelector(
  dropsFromAll,
  rawMaps,
  mapTier,
  (names, maps, maxTier) => _.filter(name => maps[name].tier <= maxTier, names),
)
// With no completion, what are the odds that other maps will drop this map?
export const dropOdds = createSelector(
  dropsFrom,
  rawMaps,
  linksByName,
  mapTier,
  (names, maps, links, tier) =>
    _.map(
      name => ({
        name,
        peers: _.filter(linkName => maps[linkName].tier === tier, links[name])
          .length,
      }),
      names,
    ),
)

const list = createSelector(rawMaps, _.sortBy(["tier", "name"]))
export const names = createSelector(list, _.map("name"))
function _mapGroup(map) {
  return map.unique ? "unique" : _.padCharsStart("0", 2, map.tier)
}
const mapGroup = createSelector(map, _mapGroup)
export const namesByGroup = createSelector(
  list,
  _.flow(
    _.groupBy(_mapGroup),
    _.mapValues(_.map("name")),
    l => console.log("namesByGroup", l) || l,
  ),
)
export const groups = createSelector(
  namesByGroup,
  _.flow(_.keys, _.sortBy(_.identity)),
)
export const groupName = (s, p) => p.group
export const tierName = (s, p) => p.tier || p.tier0 + 1
const tierIndex = createSelector(tierName, t => t - 1)
export const groupNames = createSelector(
  namesByGroup,
  groupName,
  (groups, group) => groups[group],
)
export const peerNames = createSelector(
  namesByGroup,
  mapGroup,
  (groups, group) => groups[group - 1],
)
export const groupCount = createSelector(groupNames, _.iteratee("length"))
export const totalCount = createSelector(names, _.iteratee("length"))
