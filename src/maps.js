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
  (names, maps, maxTier) =>
    _.filter(name => maps[name] && maps[name].tier <= maxTier, names),
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
        peers: _.filter(
          linkName => maps[linkName] && maps[linkName].tier === tier,
          links[name],
        ).length,
      }),
      names,
    ),
)

const list = createSelector(rawMaps, _.sortBy(["tier", "name"]))
export const names = createSelector(list, _.map("name"))
// tiers are array indexes. names[0] = tier 1 maps
export const namesByTier = createSelector(
  list,
  _.flow(
    _.groupBy("tier"),
    _.entries,
    _.sortBy(0),
    _.map(_.flow(_.get(1), _.map("name"))),
  ),
)
export const tierName = (s, p) => p.tier || p.tier0 + 1
const tierIndex = createSelector(tierName, t => t - 1)
export const tierNames = createSelector(
  namesByTier,
  tierIndex,
  (tiers, tier) => tiers[tier],
)
export const peerNames = createSelector(
  namesByTier,
  mapTier,
  (tiers, tier) => tiers[tier - 1],
)
export const tierCount = createSelector(tierNames, _.iteratee("length"))
export const totalCount = createSelector(names, _.iteratee("length"))
export const dump = {
  names: namesByTier(),
}
