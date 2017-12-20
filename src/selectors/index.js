import {combineReducers} from "redux"
import * as Filter from "./filter"
import * as Guide from "./guide"
import * as HideCompleted from "./hide-completed"
import * as Maps from "./maps"
import * as Tracker from "./tracker"
import * as Vendor from "./vendor-tree"

export {Filter, Guide, HideCompleted, Maps, Tracker, Vendor}
export const reducer = combineReducers({
  tracker: Tracker.reducer,
  filter: Filter.reducer,
  showCompleted: HideCompleted.reducer,
})
