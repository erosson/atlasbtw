import _ from "lodash/fp"
import {createSelector} from "reselect"
import * as Tracker from "./tracker"
import * as Maps from "./maps"

export function showGroup(group) {
  return Tracker.setGroupStatus(group, "completed")
}
export function hideGroup(group) {
  return Tracker.setGroupStatus(group, "hidden")
}
export function reducer(state = {}, action) {
  switch (action.type) {
    case "SET_GROUP_STATUS":
      if (action.status === "completed")
        // show group
        return {...state, [action.group]: true}
      if (action.status === "hidden")
        // hide group
        return _.omit([action.group], state)
      // other
      return state
    default:
      return state
  }
}

function showByGroup(root) {
  return root.showCompleted || {}
}
const groupProp = (s, p) => p.group
const _isShown = createSelector(
  showByGroup,
  groupProp,
  // hidden when complete, by default
  (shows, group) => shows[group] || false,
)
// always show this section if any part of it is incomplete
export const isHidden = createSelector(
  Tracker.groupStatus,
  _isShown,
  groupProp,
  (status, shown, group) => status === "completed" && !shown,
)
export const isShown = _.negate(isHidden)
const hiddenFilter = (root, props) =>
  _.memoize(group => isHidden(root, {...props, group}))
const shownFilter = createSelector(hiddenFilter, _.negate)
const groupNames = Maps.groups
export const hiddenGroups = createSelector(hiddenFilter, groupNames, _.filter)
export const shownGroups = createSelector(shownFilter, groupNames, _.filter)
