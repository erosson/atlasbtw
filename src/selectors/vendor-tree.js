import _ from "lodash/fp"
import {createSelector} from "reselect"
import * as Maps from "./maps"

export const next = _.memoize(function(name) {
  return createSelector(Maps.vendorsFromByName, vendors => vendors[name])
})
export const buildTree = createSelector(Maps.vendorsFromByName, vendors => {
  return _.memoize(function tree(name) {
    const nexts = vendors[name]
    // first element is the current item; next elements are all trees that
    // vendor up to it. There's a few maps where two others vendor up to it,
    // so support that, though usually it's one or zero.
    return [name, ...nexts.map(tree)]
  })
})
const nameProp = (s, p) => p.name
export const tree = createSelector(buildTree, nameProp, (trees, name) =>
  trees(name),
)
