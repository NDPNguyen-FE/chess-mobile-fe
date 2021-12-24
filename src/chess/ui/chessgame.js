import React from "react";
import { Layer, Stage } from "react-konva";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import useSound from "use-sound";
import VideoChatApp from "../../connection/videochat";
import { ColorContext } from "../../context/colorcontext";
import Board from "../assets/chessBoard.png";
import chessMove from "../assets/moveSoundEffect.mp3";
import Game from "../model/chess";
import Square from "../model/square";
import Piece from "./piece";
import piecemap from "./piecemap";
import "./chessgame.scss";
const socket = require("../../connection/socket").socket;

class ChessGame extends React.Component {
  state = {
    gameState: new Game(this.props.color),
    draggedPieceTargetId: "",
    playerTurnToMoveIsWhite: true,
    whiteKingInCheck: false,
    blackKingInCheck: false,
  };

  componentDidMount() {
    socket.on("opponent move", (move) => {
      if (move.playerColorThatJustMovedIsWhite !== this.props.color) {
        this.movePiece(
          move.selectedId,
          move.finalPosition,
          this.state.gameState,
          false
        );
        this.setState({
          playerTurnToMoveIsWhite: !move.playerColorThatJustMovedIsWhite,
        });
      }
    });
  }

  startDragging = (e) => {
    this.setState({
      draggedPieceTargetId: e.target.attrs.id,
    });
  };

  movePiece = (selectedId, finalPosition, currentGame, isMyMove) => {
    var whiteKingInCheck = false;
    var blackKingInCheck = false;
    var blackCheckmated = false;
    var whiteCheckmated = false;
    const update = currentGame.movePiece(selectedId, finalPosition, isMyMove);

    if (update === "moved in the same position.") {
      this.revertToPreviousState(selectedId);
      return;
    } else if (update === "user tried to capture their own piece") {
      this.revertToPreviousState(selectedId);
      return;
    } else if (update === "b is in check" || update === "w is in check") {
      if (update[0] === "b") {
        blackKingInCheck = true;
      } else {
        whiteKingInCheck = true;
      }
    } else if (
      update === "b has been checkmated" ||
      update === "w has been checkmated"
    ) {
      if (update[0] === "b") {
        blackCheckmated = true;
      } else {
        whiteCheckmated = true;
      }
    } else if (update === "invalid move") {
      this.revertToPreviousState(selectedId);
      return;
    }

    if (isMyMove) {
      socket.emit("new move", {
        nextPlayerColorToMove: !this.state.gameState.thisPlayersColorIsWhite,
        playerColorThatJustMovedIsWhite:
          this.state.gameState.thisPlayersColorIsWhite,
        selectedId: selectedId,
        finalPosition: finalPosition,
        gameId: this.props.gameId,
      });
    }

    this.props.playAudio();

    this.setState({
      draggedPieceTargetId: "",
      gameState: currentGame,
      playerTurnToMoveIsWhite: !this.props.color,
      whiteKingInCheck: whiteKingInCheck,
      blackKingInCheck: blackKingInCheck,
    });

    if (blackCheckmated) {
      alert("WHITE WON BY CHECKMATE!");
    } else if (whiteCheckmated) {
      alert("BLACK WON BY CHECKMATE!");
    }
  };

  endDragging = (e) => {
    const currentGame = this.state.gameState;
    const currentBoard = currentGame.getBoard();
    const finalPosition = this.inferCoord(
      e.target.x() + 90,
      e.target.y() + 90,
      currentBoard
    );
    const selectedId = this.state.draggedPieceTargetId;
    this.movePiece(selectedId, finalPosition, currentGame, true);
  };

  revertToPreviousState = (selectedId) => {
    const oldGS = this.state.gameState;
    const oldBoard = oldGS.getBoard();
    const tmpGS = new Game(true);
    const tmpBoard = [];

    for (var i = 0; i < 8; i++) {
      tmpBoard.push([]);
      for (var j = 0; j < 8; j++) {
        if (oldBoard[i][j].getPieceIdOnThisSquare() === selectedId) {
          tmpBoard[i].push(new Square(j, i, null, oldBoard[i][j].canvasCoord));
        } else {
          tmpBoard[i].push(oldBoard[i][j]);
        }
      }
    }

    tmpGS.setBoard(tmpBoard);

    this.setState({
      gameState: tmpGS,
      draggedPieceTargetId: "",
    });

    this.setState({
      gameState: oldGS,
    });
  };

  inferCoord = (x, y, chessBoard) => {
    var hashmap = {};
    var shortestDistance = Infinity;
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        const canvasCoord = chessBoard[i][j].getCanvasCoord();

        const delta_x = canvasCoord[0] - x;
        const delta_y = canvasCoord[1] - y;
        const newDistance = Math.sqrt(delta_x ** 2 + delta_y ** 2);
        hashmap[newDistance] = canvasCoord;
        if (newDistance < shortestDistance) {
          shortestDistance = newDistance;
        }
      }
    }

    return hashmap[shortestDistance];
  };

  render() {
    return (
      <React.Fragment>
        <div
          style={{
            backgroundImage: `url(${Board})`,
            width: "720px",
            height: "720px",
          }}
        >
          <Stage width={720} height={720}>
            <Layer>
              {this.state.gameState.getBoard().map((row) => {
                return (
                  <React.Fragment>
                    {row.map((square) => {
                      if (square.isOccupied()) {
                        return (
                          <Piece
                            x={square.getCanvasCoord()[0]}
                            y={square.getCanvasCoord()[1]}
                            imgurls={piecemap[square.getPiece().name]}
                            isWhite={square.getPiece().color === "white"}
                            draggedPieceTargetId={
                              this.state.draggedPieceTargetId
                            }
                            onDragStart={this.startDragging}
                            onDragEnd={this.endDragging}
                            id={square.getPieceIdOnThisSquare()}
                            thisPlayersColorIsWhite={this.props.color}
                            playerTurnToMoveIsWhite={
                              this.state.playerTurnToMoveIsWhite
                            }
                            whiteKingInCheck={this.state.whiteKingInCheck}
                            blackKingInCheck={this.state.blackKingInCheck}
                          />
                        );
                      }
                      return;
                    })}
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>
      </React.Fragment>
    );
  }
}

const ChessGameWrapper = (props) => {
  const domainName = "http://localhost:3000";
  const color = React.useContext(ColorContext);
  const { gameid } = useParams();
  const [play] = useSound(chessMove);
  const [opponentSocketId, setOpponentSocketId] = React.useState("");
  const [opponentDidJoinTheGame, didJoinGame] = React.useState(false);
  const [opponentUserName, setUserName] = React.useState("");
  const [gameSessionDoesNotExist, doesntExist] = React.useState(false);
  const history = useHistory();

  React.useEffect(() => {
    socket.on("playerJoinedRoom", (statusUpdate) => {
      if (socket.id !== statusUpdate.mySocketId) {
        setOpponentSocketId(statusUpdate.mySocketId);
      }
    });

    socket.on("status", (statusUpdate) => {
      alert(statusUpdate);
      if (
        statusUpdate === "This game session does not exist." ||
        statusUpdate === "There are already 2 people playing in this room."
      ) {
        history.push("/");
        doesntExist(true);
      }
    });

    socket.on("start game", (opponentUserName) => {
      if (opponentUserName !== props.myUserName) {
        setUserName(opponentUserName);
        didJoinGame(true);
      } else {
        socket.emit("request username", gameid);
      }
    });

    socket.on("give userName", (socketId) => {
      if (socket.id !== socketId) {
        socket.emit("recieved userName", {
          userName: props.myUserName,
          gameId: gameid,
        });
      }
    });

    socket.on("get Opponent UserName", (data) => {
      if (socket.id !== data.socketId) {
        setUserName(data.userName);
        setOpponentSocketId(data.socketId);
        didJoinGame(true);
      }
    });
  }, []);

  return (
    <div className="chessGame">
      {opponentDidJoinTheGame ? (
        <div>
          <h4> Opponent: {opponentUserName} </h4>
          <div style={{ display: "flex" }}>
            <ChessGame
              playAudio={play}
              gameId={gameid}
              color={color.didRedirect}
            />
            <VideoChatApp
              mySocketId={socket.id}
              opponentSocketId={opponentSocketId}
              myUserName={props.myUserName}
              opponentUserName={opponentUserName}
            />
          </div>
          <h4> You: {props.myUserName} </h4>
        </div>
      ) : gameSessionDoesNotExist ? (
        <div>
          <h1 style={{ textAlign: "center", marginTop: "200px" }}> :( </h1>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              textAlign: "center",
              marginTop: String(window.innerHeight / 8) + "px",
            }}
          >
            Hey{" "}
            <strong
              style={{
                color: "red",
                fontSize: "60px",
              }}
            >
              {props.myUserName}
            </strong>
            , copy and paste the URL below to send to your friend:
          </h1>
          <textarea
            style={{
              marginTop: "30px",
              width: "515px",
              height: "30px",
            }}
            onFocus={(event) => {
              event.target.select();
            }}
            value={domainName + "/game/" + gameid}
            type="text"
          ></textarea>
          <br></br>

          <h1 style={{ textAlign: "center", marginTop: "100px" }}>
            {" "}
            Waiting for other opponent to join the game...{" "}
          </h1>
        </div>
      )}
    </div>
  );
};

export default ChessGameWrapper;
