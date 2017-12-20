import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import "bootstrap/dist/css/bootstrap.css"
//import "bootswatch/dist/darkly/bootstrap.css"
import "bootstrap/dist/css/bootstrap-theme.css"
import App from "./view/App"
import registerServiceWorker from "./registerServiceWorker"

ReactDOM.render(<App />, document.getElementById("root"))
registerServiceWorker()
