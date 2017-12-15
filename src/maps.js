import {createSelector} from "reselect"
import _ from "lodash/fp"
import Maps from "./maps.json"
import Links from "./map-links.json"
const mapValues = _.mapValues.convert({cap: false})

export const rawMaps = createSelector(
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

export const vendorsFromByName = createSelector(rawMaps, maps => {
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
export const isUnique = mapProp("unique")
// maps this can drop from with zero completion, excluding higher-tier maps.
export const dropsFrom = createSelector(
  dropsFromAll,
  rawMaps,
  mapTier,
  (names, maps, maxTier) => _.filter(name => maps[name].tier <= maxTier, names),
)
// maps this drops/contains with zero completion
export const hasDrops = createSelector(
  dropsFromAll,
  rawMaps,
  mapTier,
  (names, maps, maxTier) => _.filter(name => maps[name].tier >= maxTier, names),
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
        unique: maps[name].unique,
        peers: _.filter(
          linkName =>
            maps[linkName].tier === tier &&
            // uniques are special - they do "drop from" their linked maps, but
            // the odds are low enough that they don't interfere with peer map
            // drops. Leave them out of odds calculations.
            !maps[linkName].unique,
          links[name],
        ).length,
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
//const tierIndex = createSelector(tierName, t => t - 1)
export const groupNames = createSelector(
  namesByGroup,
  groupName,
  (groups, group) => groups[group],
)
export const peerNames = createSelector(
  namesByGroup,
  mapGroup,
  (groups, group) => groups[group],
)
export const groupCount = createSelector(groupNames, _.iteratee("length"))
export const totalCount = createSelector(names, _.iteratee("length"))
export const unvendorables = createSelector(
  vendorsFromByName,
  rawMaps,
  (vendors, maps) =>
    _(maps)
      .filter(
        map =>
          !vendors[map.name].length &&
          // tier 1s are technically unvendorable, but they drop everywhere
          map.tier > 1 &&
          // vaal temple, shaper, and uniques don't block other maps from
          // dropping, so ignore them
          map.tier < 16 &&
          !map.unique,
      )
      .sortBy(["tier", "name"])
      .map("name")
      .value(),
)
export const numUnvendorables = createSelector(unvendorables, u => u.length)

// possible +1 drops, if they're completed
export const conditionalHasDrops = createSelector(
  map,
  hasDrops,
  rawMaps,
  namesByGroup,
  (map, drops, maps, groups) => {
    const myGroup = _mapGroup(map)
    const nextGroups = _.uniq(
      drops
        .map(name => _mapGroup(maps[name]))
        .filter(group => group !== myGroup && group !== "unique"),
    )
    if (nextGroups.length > 1) throw new Error("invalid nextgroup", nextGroups)
    const nextGroup = nextGroups[0]
    return _.difference(groups[nextGroup], drops)
  },
)
