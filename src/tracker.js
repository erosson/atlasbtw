// @flow
import _ from "lodash/fp"
import {createSelector} from "reselect"
import * as Maps from "./maps"

function local(root) {
  return root.tracker
}
const name = (state, props) => props.name
export const isCompleted = createSelector(
  name,
  local,
  (name, state) => state[name] || false,
)
function _total(state, names) {
  return _.filter(name => state[name], names).length
}
export const groupNumCompleted = createSelector(local, Maps.groupNames, _total)
export const totalNumCompleted = createSelector(local, Maps.names, _total)
const peersNumCompleted = createSelector(local, Maps.peerNames, _total)
export const dropOdds = createSelector(
  Maps.dropOdds,
  peersNumCompleted,
  (odds, num) => _.map(odd => ({...odd, peers: odd.peers + num}), odds),
)

export function complete(name) {
  return {type: "COMPLETE", name}
}
export function uncomplete(name) {
  return {type: "UNCOMPLETE", name}
}
export function toggle(name) {
  return {type: "TOGGLE", name}
}
export function clear() {
  return {type: "CLEAR"}
}

export function reducer(state = {}, action) {
  console.log("tracker.reducer", action)
  switch (action.type) {
    case "COMPLETE":
      return {...state, [action.name]: true}
    case "UNCOMPLETE":
      return _.omit([action.name], state)
    case "TOGGLE":
      return reducer(
        state,
        !!state[action.name] ? uncomplete(action.name) : complete(action.name),
      )
    case "CLEAR":
      return {}
    default:
      return state
  }
}
