// クリックイベントが追加されたかどうかを示すフラグ
let promoteButtonClicked = false;
let unpromoteButtonClicked = false;

// クリックイベントハンドラ
function promoteButtonClickHandler() {
  Board.promotePiece(true, piece, targetCell);
}

function unpromoteButtonClickHandler() {
  Board.promotePiece(false, piece, targetCell);
}

class SomeClass {
  static displayPromoteButtons(piece, targetCell) {
    if (!piece || !targetCell) {
      return;
    }
    
    // プロモートのチェックを開始する
    pauseGame = true;
    Board.setPromoteButtonsDisplay(true);
  }

  static promotePiece = (state, piece, targetCell) => {
    piece.setPromoteState(state);
    targetCell.setPiece(piece);
    Board.setPromoteButtonsDisplay(false);
    pauseGame = false;
    console.log(80);
    nextTeam();
  }
}

class Piece{

}
