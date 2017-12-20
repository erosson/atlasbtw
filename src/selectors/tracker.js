import _ from "lodash/fp"
import {createSelector} from "reselect"
import * as Maps from "./maps"

function local(root) {
  return root.tracker
}
const name = (state, props) => props.name
// The distinction between completed and unlocked (complete without bonus)
// isn't important here.
//const statuses = _.keyBy(_.identity, ["completed", "owned", "empty"])
const _status = status => (status === true ? "completed" : status || "empty")
export const status = createSelector(name, local, (name, local) =>
  _status(local[name]),
)
const _isCompleted = status => _status(status) === "completed"
export const isCompleted = createSelector(status, _isCompleted)
const _isOwned = status =>
  _status(status) === "owned" || _status(status) === "completed"
export const isOwned = createSelector(status, _isOwned)
function _totalCompleted(state, names) {
  return _.filter(name => _isCompleted(state[name]), names).length
}
function _totalOwned(state, names) {
  return _.filter(name => _isOwned(state[name]), names).length
}
export const groupNumCompleted = createSelector(
  local,
  Maps.groupNames,
  _totalCompleted,
)
export const groupNumOwned = createSelector(local, Maps.groupNames, _totalOwned)
export const groupStatus = createSelector(
  local,
  Maps.groupNames,
  (state, names) => {
    const statuses = _.uniq(_.map(name => _status(state[name]), names))
    return statuses.length === 1 ? statuses[0] : null
  },
)
export const totalNumCompleted = createSelector(
  local,
  Maps.names,
  _totalCompleted,
)
const peersNumCompleted = createSelector(local, Maps.peerNames, _totalCompleted)
export const dropOdds = createSelector(
  Maps.dropOdds,
  peersNumCompleted,
  (odds, num) => _.map(odd => ({...odd, peers: odd.peers + num}), odds),
)
export const hasDrops = createSelector(
  Maps.hasDrops,
  Maps.conditionalHasDrops,
  local,
  (drops, maybeDrops, state) =>
    _.concat(drops, maybeDrops.filter(name => state[name])),
)
const _isEmpty = _.negate(_isOwned)
export const emptyUnvendorables = createSelector(
  Maps.unvendorables,
  local,
  (names, state) => names.filter(name => _isEmpty(state[name])),
)

export function setStatus(name, status) {
  return {type: "SET_MAP_STATUS", name, status}
}
export function setGroupStatus(group, status) {
  return {type: "SET_GROUP_STATUS", group, status}
}
export function clear() {
  return {type: "CLEAR"}
}

export function reducer(state = {}, action) {
  console.log("tracker.reducer", action)
  switch (action.type) {
    case "SET_MAP_STATUS":
      if (action.status === "empty") {
        return _.omit([action.name], state)
      }
      return {...state, [action.name]: action.status}
    case "SET_GROUP_STATUS":
      const names = Maps.groupNames(null, {group: action.group})
      if (action.status === "empty") {
        return _.omit(names, state)
      }
      const status = action.status === "hidden" ? "completed" : action.status
      return {
        ...state,
        ..._.fromPairs(_.map(name => [name, status], names)),
      }
    case "CLEAR":
      return {}
    default:
      return state
  }
}
