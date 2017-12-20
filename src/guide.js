import _ from "lodash/fp"
import {createSelector} from "reselect"
import * as Maps from "./maps"
import * as Tracker from "./tracker"

export const nextUnvendorable = createSelector(
  Tracker.emptyUnvendorables,
  names => (names.length ? names[0] : null),
)
function withNextUnvendorable(selector) {
  return (state, props) => {
    const name = nextUnvendorable(state, props)
    return name && selector(state, {...props, name})
  }
}
export const nextUnvendorableDropsFrom = _.flow(
  withNextUnvendorable(Maps.dropsFrom),
  list => (list && list.length ? list[0] : null),
)
export const nextUnvendorableTier = withNextUnvendorable(Maps.mapTier)
export function isSafeToComplete(state, props) {
  const nextTier = nextUnvendorableTier(state, props)
  const targetTier = Maps.mapTier(state, props)
  return targetTier + 2 <= nextTier
}
