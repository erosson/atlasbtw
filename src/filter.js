import {createSelector} from "reselect"
import _ from "lodash/fp"
import * as Maps from "./maps"

export const filterInput = s => s.filter || ""
const parseInput = createSelector(filterInput, input => {
  const tokens = input.split(" ")
  let ret = {}
  let words = []
  for (let token of tokens) {
    if (_.startsWith("tier:", token)) {
      const tier = parseInt(token.slice("tier:".length)) || undefined
      ret = {...ret, tier}
    } else if (token === "unique") {
      ret = {...ret, unique: true}
    } else if (token === "novendor") {
      ret = {...ret, novendor: true}
    } else {
      words.push(token)
    }
  }
  ret = {...ret, regexp: new RegExp(words.join(""))}
  console.log("parseInput", ret)
  return ret
})
const filterPred = createSelector(
  parseInput,
  Maps.vendorsFromByName,
  (crit, vendors) => map => {
    if ("unique" in crit && crit.unique != map.unique) return false
    if ("tier" in crit && crit.tier !== map.tier) return false
    if ("novendor" in crit && vendors[map.name].length) return false
    return crit.regexp.test(map.name)
  },
)
const filter = createSelector(filterPred, Maps.rawMaps, (pred, maps) => name =>
  pred(maps[name]),
)
export const groupNames = createSelector(filter, Maps.groupNames, _.filter)

export function setInput(input) {
  return {type: "SET_FILTER_INPUT", input}
}
export function reducer(state = "", action) {
  switch (action.type) {
    case "SET_FILTER_INPUT":
      return action.input
    default:
      return state
  }
}
