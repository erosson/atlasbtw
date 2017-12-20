import React from "react"
import ReactDOM from "react-dom"
import App from "./App"

function mock(name) {
  return props => (
    <pre>
      {name}: {/*JSON.stringify(props, null, 2)*/}
    </pre>
  )
}
jest.mock("react-bootstrap/lib/Navbar", () => mock("Navbar"))
jest.mock("react-bootstrap/lib/FormGroup", () => mock("FormGroup"))
jest.mock("react-bootstrap/lib/FormControl", () => mock("FormControl"))
jest.mock("react-bootstrap/lib/Button", () => mock("Button"))
jest.mock("react-bootstrap/lib/ToggleButton", () => mock("ToggleButton"))
jest.mock("react-bootstrap/lib/ToggleButtonGroup", () =>
  mock("ToggleButtonGroup"),
)
jest.mock("react-bootstrap/lib/Panel", () => mock("Panel"))
jest.mock("react-bootstrap/lib/Well", () => mock("Well"))
jest.mock("react-bootstrap/lib/ListGroup", () => mock("ListGroup"))
jest.mock("react-bootstrap/lib/ListGroupItem", () => mock("ListGroupItem"))

it("renders without crashing", () => {
  const div = document.createElement("div")
  ReactDOM.render(<App />, div)
})
