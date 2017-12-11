import * as React from "react"
import _ from "lodash/fp"
import {createStore, combineReducers} from "redux"
import {createStructuredSelector} from "reselect"
import {connect, Provider} from "react-redux"
import * as Maps from "./maps"
import * as Tracker from "./tracker"
const map = _.map.convert({cap: false})

function TrackerLinkRender(props) {
  const {name, vendorsFrom, dropsFrom, isCompleted, toggleComplete} = props
  return (
    <li>
      {isCompleted ? (
        <div>
          <button onClick={toggleComplete}>{name}</button>: done
        </div>
      ) : (
        <div>
          <div>
            <button onClick={toggleComplete}>{name}</button>: incomplete.
          </div>
          <div>
            {vendorsFrom.length ? (
              "vendors from: " + vendorsFrom.join(", ")
            ) : (
              <i>NO VENDOR.</i>
            )}
          </div>
          <div>
            {dropsFrom.length
              ? "drops from: " +
                dropsFrom
                  .map(
                    ({name, peers}) =>
                      name + " (" + Math.floor(100 / peers) + "%)",
                  )
                  .join(", ")
              : // for T1s.
                null}
          </div>
        </div>
      )}
    </li>
  )
}
const TrackerLink = connect(
  createStructuredSelector({
    isCompleted: Tracker.isCompleted,
    vendorsFrom: Maps.vendorsFrom,
    dropsFrom: Tracker.dropOdds,
  }),
  {
    toggleComplete: Tracker.toggle,
  },
  (s, d, p) => ({
    ...s,
    ...p,
    toggleComplete: () => d.toggleComplete(p.name),
  }),
)(TrackerLinkRender)

function TierRender(props) {
  const {names, tier, numCompleted, numTotal} = props
  return (
    <div>
      <h3>
        Tier {tier}: {numCompleted}/{numTotal}
      </h3>
      <ul>{map(name => <TrackerLink key={name} name={name} />, names)}</ul>
      {/* {JSON.stringify(names, null, 2)} */}
    </div>
  )
}
const Tier = connect(
  createStructuredSelector({
    tier: Maps.tierName,
    numCompleted: Tracker.tierNumCompleted,
    numTotal: Maps.tierCount,
  }),
)(TierRender)

function AppRender(props) {
  const {namesByTier, numCompleted, numTotal} = props
  return (
    <div className="App">
      <h1>Path of Exile Atlas Planner</h1>
      <h3>
        All maps: {numCompleted}/{numTotal}
      </h3>
      {map(
        (names, tier0) => <Tier key={tier0} tier0={tier0} names={names} />,
        namesByTier,
      )}
      {/* <pre>{JSON.stringify(props, null, 2)}</pre> */}
    </div>
  )
}
const App = connect(
  createStructuredSelector({
    namesByTier: Maps.namesByTier,
    numCompleted: Tracker.totalNumCompleted,
    numTotal: Maps.totalCount,
  }),
)(AppRender)

const reducer = combineReducers({
  tracker: Tracker.reducer,
})
const PERSIST_KEY = "poeatlas"
function load() {
  try {
    return JSON.parse(window.localStorage.getItem(PERSIST_KEY))
  } catch (e) {
    console.error(e)
    return undefined
  }
}
const store = createStore(reducer, load() || undefined)
function save() {
  console.log("persist", store.getState())
  window.localStorage.setItem(PERSIST_KEY, JSON.stringify(store.getState()))
}
store.subscribe(save)
export default function Main() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
