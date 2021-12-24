import React from "react";
import { Redirect } from "react-router-dom";
import uuid from "uuid/v4";
import { ColorContext } from "../context/colorcontext";
import "./onboard.scss";
const socket = require("../connection/socket").socket;
class CreateNewGame extends React.Component {
  state = {
    didGetUserName: false,
    inputText: "",
    gameId: "",
  };

  constructor(props) {
    super(props);
    this.textArea = React.createRef();
  }

  send = () => {
    const newGameRoomId = uuid();

    this.setState({
      gameId: newGameRoomId,
    });

    localStorage.setItem("roomId", newGameRoomId);

    socket.emit("createNewGame", newGameRoomId);
  };

  typingUserName = () => {
    const typedText = this.textArea.current.value;

    this.setState({
      inputText: typedText,
    });
  };

  render() {
    return (
      <div className="createGame">
        {this.state.didGetUserName ? (
          <Redirect to={"/game/" + this.state.gameId}>
            <button className="btn btn-success btn-start">Start Game</button>
          </Redirect>
        ) : (
          <div className="createGame-input">
            <h1>Your username:</h1>
            <div className="createGame-form">
              <input ref={this.textArea} onInput={this.typingUserName}></input>

              <button
                className="btn btn-primary btn-create"
                disabled={!(this.state.inputText.length > 0)}
                onClick={() => {
                  this.props.didRedirect();
                  this.props.setUserName(this.state.inputText);
                  this.setState({
                    didGetUserName: true,
                  });
                  this.send();
                }}
              >
                Create Game
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const Onboard = (props) => {
  const color = React.useContext(ColorContext);

  return (
    <CreateNewGame
      didRedirect={color.playerDidRedirect}
      setUserName={props.setUserName}
    />
  );
};

export default Onboard;
