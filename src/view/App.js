import * as React from "react"
import _ from "lodash/fp"
import {createStore} from "redux"
import {createStructuredSelector} from "reselect"
import {connect, Provider} from "react-redux"
import {
  Maps,
  Tracker,
  Guide,
  Filter,
  Vendor,
  HideCompleted,
  reducer,
} from "../selectors"
import * as Navbar from "react-bootstrap/lib/Navbar"
import * as FormGroup from "react-bootstrap/lib/FormGroup"
import * as FormControl from "react-bootstrap/lib/FormControl"
import * as Button from "react-bootstrap/lib/Button"
import * as ToggleButton from "react-bootstrap/lib/ToggleButton"
import * as ToggleButtonGroup from "react-bootstrap/lib/ToggleButtonGroup"
import * as Panel from "react-bootstrap/lib/Panel"
import * as Well from "react-bootstrap/lib/Well"
import * as ListGroup from "react-bootstrap/lib/ListGroup"
import * as ListGroupItem from "react-bootstrap/lib/ListGroupItem"
const map = _.map.convert({cap: false})

function groupLabel(name) {
  if (name === "unique") return "Uniques"
  return "Tier " + parseInt(name, 10)
}

const lowerWords = _.keyBy(_.identity, ["of", "the"])
function titleCase(name) {
  //return _.startCase(name) // nope - this eats punctuation and accents
  return name
    .split(" ")
    .map(
      (word, index) =>
        // Skip capitalization of minor words, unless they're the first word.
        // Capitalize "the" in "the vinktar square", but not "forge of the phoenix"
        word in lowerWords && index !== 0 ? word : _.upperFirst(word),
    )
    .join(" ")
}
// linkable anchor with an offset, so it's not underneath the top header
function Anchor({id}) {
  return (
    <div
      id={id}
      style={{display: "block", position: "relative", top: "-70px"}}
    />
  )
}
function VendorTreeRender(props) {
  const {tree, depth, maxdepth, top, top2} = props
  const [name, ...tail] = tree
  if (top && !tail.length) {
    return (
      <div>
        <i>UNVENDORABLE</i>
      </div>
    )
  }
  if (depth >= maxdepth) return "..."
  return (
    <div>
      <div style={{float: "left", verticalAlign: "middle"}}>
        {top ? (
          <span>3-to-1 vendor:&nbsp;</span>
        ) : (
          <span>
            {top2 ? null : <span>&nbsp;&lt;&nbsp;</span>}
            <a href={"#" + name}>{titleCase(name)}</a>
          </span>
        )}
      </div>
      <div style={{float: "left", verticalAlign: "middle"}}>
        {tail.map(tree2 => (
          <VendorTreeRender
            maxdepth={maxdepth}
            depth={depth + 1}
            tree={tree2}
            top2={top}
          />
        ))}
      </div>
      <div style={{clear: "left"}} />
    </div>
  )
  //return (
  //  <div>
  //    {vendorsFrom.length ? (
  //      "3-to-1 vendor: " + vendorsFrom.map(titleCase).join(", ")
  //    ) : (
  //      <i>UNVENDORABLE</i>
  //    )}
  //  </div>
  //)
}
const VendorTree = connect(
  createStructuredSelector({
    tree: Vendor.tree,
    top: () => true,
    maxdepth: () => 6,
    depth: () => 0,
  }),
)(VendorTreeRender)
function TrackerLinkRender(props) {
  const {
    name,
    tier,
    dropsFrom,
    status,
    isUnique,
    isSafeToComplete,
    onChange,
  } = props
  return (
    <ListGroupItem
      header={[
        <Anchor id={name} key={"anchor-" + name} />,
        <label
          name={name}
          key="label"
          for={"status-" + name}
          style={{marginLeft: "0.3em"}}
        >
          {titleCase(name)}
        </label>,
        <ToggleButtonGroup
          key="status"
          name={"status-" + name}
          type="radio"
          value={status}
          style={{float: "right"}}
          onChange={onChange}
        >
          <ToggleButton
            value="completed"
            title="You've beaten this map's boss and added it to your atlas (with or without the bonus). It can drop from any map."
          >
            Completed
          </ToggleButton>
          <ToggleButton
            value="owned"
            title="You've found this map, but haven't completed it; it's waiting patiently in your stash. It can drop only from adjacent maps."
          >
            Found
          </ToggleButton>
          <ToggleButton
            value="empty"
            title="You have not yet found this map. It can drop only from adjacent maps."
          >
            Empty
          </ToggleButton>
        </ToggleButtonGroup>,
      ]}
    >
      {status === "empty" ? (
        <div>
          {tier > 1 && tier < 16 && !isUnique ? (
            <VendorTree name={name} />
          ) : null}
          <div>
            {dropsFrom.length ? (
              <span>
                Found in:{" "}
                {dropsFrom.map(
                  ({name, peers, unique}, i) =>
                    // uniques don't interfere with others' odds.
                    !!unique || !!isUnique ? (
                      <span>
                        {i !== 0 ? ", " : ""}
                        <a href={"#" + name}>{titleCase(name)}</a>
                      </span>
                    ) : (
                      <span>
                        {i !== 0 ? ", " : ""}
                        <a href={"#" + name}>
                          {titleCase(name) +
                            " (" +
                            Math.floor(100 / peers) +
                            "%)"}
                        </a>
                      </span>
                    ),
                )}
              </span>
            ) : // for T1s.
            null}
          </div>
          {/*<div>
            {hasDrops.length
              ? "Contains: " + hasDrops.map(titleCase).join(", ")
              : // for top tiers, uniques
                null}
          </div>*/}
        </div>
      ) : null}
      {status === "owned" ? (
        isSafeToComplete ? (
          <div>It's safe to complete this map.</div>
        ) : (
          <div>
            It's <b>not safe</b> to complete this map yet - doing so will slow
            your atlas progression. Wait a while, clear some other maps first.
          </div>
        )
      ) : null}
    </ListGroupItem>
  )
}
const TrackerLink = connect(
  createStructuredSelector({
    isCompleted: Tracker.isCompleted,
    status: Tracker.status,
    tier: Maps.mapTier,
    isUnique: Maps.isUnique,
    dropsFrom: Tracker.dropOdds,
    isSafeToComplete: Guide.isSafeToComplete,
    //hasDrops: Tracker.hasDrops,
  }),
  {
    setStatus: Tracker.setStatus,
  },
  (s, d, p) => ({
    ...s,
    ...p,
    onChange: status => d.setStatus(p.name, status),
  }),
)(TrackerLinkRender)

function GroupRender(props) {
  const {
    names,
    group,
    numCompleted,
    numFound,
    numTotal,
    status,
    onChange,
  } = props
  if (!names.length) return null
  const stats =
    numCompleted === numFound
      ? numCompleted + "/" + numTotal
      : numCompleted +
        "/" +
        numTotal +
        " completed, " +
        numFound +
        "/" +
        numTotal +
        " found"
  return (
    <Panel
      header={[
        <span key="label">{groupLabel(group) + ": " + stats}</span>,
        <ToggleButtonGroup
          key="group-status"
          name={"group-status-" + group}
          type="radio"
          value={status}
          style={{float: "right"}}
          onChange={onChange}
        >
          <ToggleButton
            value="hidden"
            title="You've beaten this map's boss and added it to your atlas (with or without the bonus). It can drop from any map."
          >
            Completed + Hidden
          </ToggleButton>
          <ToggleButton
            value="completed"
            title="You've beaten this map's boss and added it to your atlas (with or without the bonus). It can drop from any map."
          >
            Completed
          </ToggleButton>
          <ToggleButton
            value="owned"
            title="You've found this map, but haven't completed it; it's waiting patiently in your stash. It can drop only from adjacent maps."
          >
            Found
          </ToggleButton>
          <ToggleButton
            value="empty"
            title="You have not yet found this map. It can drop only from adjacent maps."
          >
            Empty
          </ToggleButton>
        </ToggleButtonGroup>,
        <div style={{clear: "right"}} key="group-status-clear" />,
      ]}
    >
      <ListGroup>
        {map(name => <TrackerLink key={name} name={name} />, names)}
      </ListGroup>
      {/* {JSON.stringify(names, null, 2)} */}
    </Panel>
  )
}
const Group = connect(
  createStructuredSelector({
    group: Maps.groupName,
    names: Filter.groupNames,
    numCompleted: Tracker.groupNumCompleted,
    numFound: Tracker.groupNumOwned,
    numTotal: Maps.groupCount,
    status: Tracker.groupStatus,
  }),
  {setGroupStatus: Tracker.setGroupStatus},
  (s, d, p) => ({
    ...s,
    ...p,
    onChange: status => d.setGroupStatus(s.group, status),
  }),
)(GroupRender)

function GuideRender(props) {
  const {next, nextDropsFrom, nextTier} = props
  const prevTier = nextTier - 1
  const prevTier2 = prevTier - 1
  if (!next) return null
  return (
    <div>
      <div>
        You should try to find{" "}
        <b>
          <a href={"#" + next}>{titleCase(next)}</a> (T{nextTier}){" "}
        </b>{" "}
        next. Complete{" "}
        <a href={"#" + nextDropsFrom}>{titleCase(nextDropsFrom)}</a> (T{
          prevTier
        }) as soon as possible, and continue running{" "}
        <a href={"#" + nextDropsFrom}>{titleCase(nextDropsFrom)}</a> until{" "}
        <a href={"#" + next}>{titleCase(next)}</a> drops.
      </div>
      <div>
        Collect other maps from Tier {prevTier} and {nextTier}, but don't
        complete them yet.
      </div>
      {prevTier2 === 1 ? (
        <div>
          Feel free to complete all Tier {prevTier2} maps as you find them.
        </div>
      ) : null}
      {prevTier2 > 1 ? (
        <div>
          Feel free to complete all Tier {prevTier2} or less maps as you find
          them. Use the 3-to-1 vendor recipe as needed.
        </div>
      ) : null}
    </div>
  )
}
const GuideView = connect(
  createStructuredSelector({
    next: Guide.nextUnvendorable,
    nextDropsFrom: Guide.nextUnvendorableDropsFrom,
    nextTier: Guide.nextUnvendorableTier,
  }),
)(GuideRender)

function MinimizedCompletedRender(props) {
  const {names, showGroup} = props
  if (!names.length) return null
  return (
    <div>
      Completed:{" "}
      {names.map((name, i) => [
        i !== 0 ? ", " : null,
        //<Button bsStyle="link" onClick={() => showGroup(name)}>
        //  {groupLabel(name)}
        //</Button>,
        <a
          href={"#" + name}
          onClick={e => {
            e.preventDefault()
            showGroup(name)
            return false
          }}
        >
          {groupLabel(name)}
        </a>,
      ])}
    </div>
  )
}
const MinimizedCompleted = connect(
  createStructuredSelector({
    names: HideCompleted.hiddenGroups,
  }),
  {
    showGroup: HideCompleted.showGroup,
  },
)(MinimizedCompletedRender)
function AppRender(props) {
  const {
    groups,
    numCompleted,
    numTotal,
    input,
    setInput,
    onClear,
    unvendorables,
    numUnvendorables,
  } = props
  console.log(props)
  return (
    <div className="App container">
      <Navbar inverse fixedTop>
        <Navbar.Header>
          <Navbar.Brand>
            AtlasBTW: SSF atlas tracking for Path of Exile
          </Navbar.Brand>
        </Navbar.Header>
        <Navbar.Form pullLeft>
          <FormGroup>
            <FormControl
              type="text"
              placeholder="&quot;&lt;name&gt;&quot;, &quot;unique&quot;, &quot;novendor&quot;"
              value={input}
              onChange={setInput}
            />
            <Button>Filter</Button>
          </FormGroup>
        </Navbar.Form>
      </Navbar>
      <Well style={{marginTop: "70px"}}>
        <Button style={{float: "right"}} onClick={onClear}>
          Clear all
        </Button>
        <div>
          <Anchor id="top" />
          Maps completed: {numCompleted}/{numTotal}{" "}
          {numCompleted === numTotal ? ":)" : null}
        </div>
        <div>
          <div>
            Unvendorable maps found (no 3-to-1 vendor recipe):{" "}
            {numUnvendorables - unvendorables.length} / {numUnvendorables}
            {unvendorables.length === 0 ? " :)" : null}
          </div>
          {unvendorables.length ? (
            <div>
              Remaining unvendorables:{" "}
              {unvendorables.map((name, i) => (
                <span style={{fontWeight: i === 0 ? "bold" : ""}}>
                  {i !== 0 ? ", " : ""}
                  <a href={"#" + name}>{titleCase(name)}</a>
                </span>
              ))}
            </div>
          ) : null}
          <div>&nbsp;</div>
          <GuideView />
          <div>&nbsp;</div>
          <div>
            This page's suggestions are based on{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://pasteio.com/xz98LT1wZdxT"
            >
              Karvarousku's
            </a>{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://pastebin.com/GPtyP9yQ"
            >
              SSF atlas
            </a>{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.youtube.com/watch?v=hj5VJ9dbfqk"
            >
              guides
            </a>, plus what's worked for me. The suggestions assume you're
            aiming for a 100%-complete atlas - if you'd rather farm shaped maps,
            adjust your approach accordingly when you reach tier 10+.
          </div>
          <MinimizedCompleted />
        </div>
      </Well>
      {map(group => <Group key={group} group={group} />, groups)}
      {/* <pre>{JSON.stringify(props, null, 2)}</pre> */}
    </div>
  )
}
const App = connect(
  createStructuredSelector({
    input: Filter.filterInput,
    groups: HideCompleted.shownGroups,
    numCompleted: Tracker.totalNumCompleted,
    numTotal: Maps.totalCount,
    unvendorables: Tracker.emptyUnvendorables,
    numUnvendorables: Maps.numUnvendorables,
  }),
  {setInput: Filter.setInput, onClear: Tracker.clear},
  (s, d, p) => ({
    ...s,
    ...p,
    setInput: event => d.setInput(event.target.value),
    onClear: () =>
      window.confirm("Are you sure you want to erase all maps tracked so far?")
        ? d.onClear()
        : null,
  }),
)(AppRender)

const PERSIST_KEY = "poeatlas"
function load() {
  if (!window.localStorage) return {} // unit tests, incognito
  try {
    return JSON.parse(window.localStorage.getItem(PERSIST_KEY))
  } catch (e) {
    console.error(e)
    return undefined
  }
}
const store = createStore(reducer, load() || undefined)
function save() {
  const state = _.pick(["tracker", "showCompleted"], store.getState())
  window.localStorage.setItem(PERSIST_KEY, JSON.stringify(state))
}
store.subscribe(save)
export default function Main() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
