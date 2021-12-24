import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import ChessGame from "./chess/ui/chessgame";
import { ColorContext } from "./context/colorcontext";
import JoinGame from "./onboard/joingame";
import JoinRoom from "./onboard/joinroom";
import Onboard from "./onboard/onboard";
import "./App.scss";

function App() {
  const [didRedirect, setDidRedirect] = React.useState(false);

  const playerDidRedirect = React.useCallback(() => {
    setDidRedirect(true);
  }, []);

  const playerDidNotRedirect = React.useCallback(() => {
    setDidRedirect(false);
  }, []);

  const [userName, setUserName] = React.useState("");

  return (
    <ColorContext.Provider
      value={{
        didRedirect: didRedirect,
        playerDidRedirect: playerDidRedirect,
        playerDidNotRedirect: playerDidNotRedirect,
      }}
    >
      <Router>
        <Switch>
          <Route path="/" exact>
            <Onboard setUserName={setUserName} />
          </Route>
          <Route path="/game/:gameid" exact>
            {didRedirect ? (
              <div className="joinGame">
                <div className="joinGame-content">
                  <JoinGame userName={userName} isCreator={true} />
                  <ChessGame myUserName={userName} />
                </div>
              </div>
            ) : (
              <JoinRoom />
            )}
          </Route>
          <Redirect to="/" />
        </Switch>
      </Router>
    </ColorContext.Provider>
  );
}

export default App;
