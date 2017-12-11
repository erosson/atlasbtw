import * as React from "react"
import _ from "lodash/fp"
import {createStore, combineReducers} from "redux"
import {createStructuredSelector} from "reselect"
import {connect, Provider} from "react-redux"
import * as Maps from "./maps"
import * as Tracker from "./tracker"
import * as Navbar from "react-bootstrap/lib/Navbar"
import * as Nav from "react-bootstrap/lib/Nav"
import * as NavItem from "react-bootstrap/lib/NavItem"
import * as FormGroup from "react-bootstrap/lib/FormGroup"
import * as FormControl from "react-bootstrap/lib/FormControl"
import * as Button from "react-bootstrap/lib/Button"
import * as Panel from "react-bootstrap/lib/Panel"
import * as Well from "react-bootstrap/lib/Well"
import * as ListGroup from "react-bootstrap/lib/ListGroup"
import * as ListGroupItem from "react-bootstrap/lib/ListGroupItem"
import * as Checkbox from "react-bootstrap/lib/Checkbox"
const map = _.map.convert({cap: false})

function TrackerLinkRender(props) {
  const {name, vendorsFrom, dropsFrom, isCompleted, toggleComplete} = props
  return (
    <ListGroupItem
      header={[
        <input
          key="checkbox"
          type="checkbox"
          name={name}
          id={"checkbox-" + name}
          checked={isCompleted}
          onClick={toggleComplete}
        />,
        <label
          key="label"
          for={"checkbox-" + name}
          style={{marginLeft: "0.3em"}}
        >
          {_.startCase(name)}
        </label>,
      ]}
    >
      {isCompleted ? null : (
        <div>
          <div>
            {vendorsFrom.length ? (
              "vendors from: " + vendorsFrom.join(", ")
            ) : (
              <i>NO VENDOR</i>
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
    </ListGroupItem>
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
    <Panel header={"Tier " + tier + ": " + numCompleted + "/" + numTotal}>
      <ListGroup>
        {map(name => <TrackerLink key={name} name={name} />, names)}
      </ListGroup>
      {/* {JSON.stringify(names, null, 2)} */}
    </Panel>
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
    <div className="App container">
      <Navbar inverse>
        <Navbar.Header>
          <Navbar.Brand>Path of Exile Atlas Planner</Navbar.Brand>
        </Navbar.Header>
        {/*<Navbar.Form pullLeft>
          <FormGroup>
            <FormControl type="text" placeholder="Search" value="xyz" />
            <Button>Filter</Button>
          </FormGroup>
        </Navbar.Form>*/}
      </Navbar>
      <Well>
        All maps: {numCompleted}/{numTotal}
      </Well>
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
