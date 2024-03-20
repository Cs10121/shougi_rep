// 定数
const DIRECTIONS = {
  UP: { x: 0, y: 1 },
  DOWN: { x: 0, y: -1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UPLEFT: { x: -1, y: 1 },
  UPRIGHT: { x: 1, y: 1 },
  DOWNLEFT: { x: -1, y: -1 },
  DOWNRIGHT: { x: 1, y: -1 }
};

const BOARD_SIZE = 9;
const BLANK_MARK = "　";

// 変数
let nowTeam = false;
let nowSelectCell = null;
let nowSelectHoldPiece = null;
let teamFlaseHoldPiece = [];
let teamTrueHoldPiece = [];

let pauseGame = false;

// ボード関連の関数
class Board {
  static createBoard(cells) {
    const boardElement = document.getElementById('board');
    if (boardElement) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        const tr = document.createElement('tr');
        for (let col = 0; col < BOARD_SIZE; col++) {
          const td = document.createElement('td');
          const position = [row, col];

          const [x, y] = Board.convPositionToIndex(position)
          const cell = cells[x][y];

          td.appendChild(cell.element);
          tr.appendChild(td);
        }
        boardElement.appendChild(tr);
      }
    } else {
      console.error("boardElement not found");
    }
  }
  static convPositionToIndex(position) {
    const x = position[1];
    const y = BOARD_SIZE - position[0] - 1;
    return [x, y];
  }

  static checkInBoard(position) {
    if (!position) {
      return null;
    }

    const [x, y] = position;
    return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
  }

  static addPosition(currentPosition, positions) {
    return positions.map(pos => [currentPosition[0] + pos[0], currentPosition[1] + pos[1]]);
  }

  static setPromoteButtonsDisplay(state, promoteButton = null, unpromoteButton = null){
    const promoteButtonsContainer = document.getElementById('promote-buttons-container');
    promoteButtonsContainer.style.display = state ? 'flex' : 'none';

    if (state) {
      promoteButtonsContainer.innerHTML = '';
      // ボタンをコンテナに追加
      promoteButtonsContainer.appendChild(promoteButton);
      promoteButtonsContainer.appendChild(unpromoteButton);
    }
  }

  static displayPromoteButtons(piece, targetCell) {
    if (!piece || !targetCell) {
        return;
    }
    // プロモートのチェックを開始する
    pauseGame = true;
    const promoteButton = this.createPromoteButton("成る", true, piece, targetCell);
    const unpromoteButton = this.createPromoteButton("成らず", false, piece, targetCell);
    Board.setPromoteButtonsDisplay(true, promoteButton, unpromoteButton);
  }

  static createPromoteButton(text, state, piece, targetCell) {
    const promoteButton = document.createElement('button');
    promoteButton.addEventListener('click', function() {
      Board.promotePiece(state, piece, targetCell);
    });
    promoteButton.textContent = text;
    return promoteButton;
  }

  static promotePiece = (state, piece, targetCell) => {
    piece.setPromoteState(state);
    targetCell.setPiece(piece);
    Board.setPromoteButtonsDisplay(false);
    pauseGame = false;
    nextTeam();
  }
}

class PieceManager {
  static createNewPiece(type, position, team, isAlive=true) {
    return new type(position, team, isAlive);
  }
  
  static initializeSetPiece() {
    const set = (type, position) => {
      const revresPosition = reversingPosition(position, true, false);
      const opponentPosition = reversingPosition(position, false, true);
      const revresOpponentPosition = reversingPosition(position, true, true);
      cellManamger.setNewPiece(type, position, false);
      cellManamger.setNewPiece(type, revresPosition, false);
      cellManamger.setNewPiece(type, opponentPosition, true);
      cellManamger.setNewPiece(type, revresOpponentPosition, true);
    };
    const setPoint = (type, position) => {
      const opponentPosition = reversingPosition(position, true, true);
      cellManamger.setNewPiece(type, position, false);
      cellManamger.setNewPiece(type, opponentPosition, true);
    };
  
    const reversingPosition = (position, revresX=false, revresY=false) => {
      const x = revresX ? BOARD_SIZE - position[0] - 1 : position[0];
      const y = revresY ? BOARD_SIZE - position[1] - 1 : position[1];
      return([x, y])
    }
  
    setPoint(King, [4,0]);
    set(Gold, [3, 0]);
    set(Silver, [2, 0]);
    set(Knight, [1, 0]);
    set(Lance, [0, 0]);
    setPoint(Bishop, [1, 1]);
    setPoint(Rook, [7, 1]);
    set(Pawn, [0, 2]);
    set(Pawn, [1, 2]);
    set(Pawn, [2, 2]);
    set(Pawn, [3, 2]);
    setPoint(Pawn, [4, 2]); 
  }
  
  static checkCanPromotePiece(piece) {
    if (!piece) {
      return false;
    }
    const type = piece.constructor;
    if(type == King || type == Gold || piece.isPromote) {
      return false;
    }
    return true;
  }

  static getPiece(position) {
    const cell = cellManamger.getCell(position);
    if (cell) {
      return cell.piece;
    }
  }

  static checkIfLineContainsPieces(line, piece) {
    if (line == null || !piece) {
      return true;
    }

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = [line, i];
      const getPiece = this.getPiece(pos);
      if (!getPiece) {
        continue;
      }

      const sameTeam = getPiece.team == piece.team;
      const samePiece = getPiece.constructor == piece.constructor;

      if (sameTeam && samePiece && getPiece.isPromote) {
        return true;
      }
    }
    return false;
  }

  static checkCanMoveInsideBoard(piece, position) {
    if (!piece || !position) {
      return false;
    }
  
    const moveables = piece.getNormalMoveable(position);
    for (const moveable of moveables) {
      if (Board.checkInBoard(moveable)) {
        return true;
      }
    }
  
    return false;
  }
  

  static checkCanPlacing(piece, position) {
    if (!piece || !position) {
      return false;
    }
    const type = piece.constructor;
    const isCanMove = this.checkCanMoveInsideBoard(piece, position);
    if (!isCanMove) {
      return false;
    }

    switch (type) {
      case King:
        return false;
      case Pawn:
        const isContain = PieceManager.checkIfLineContainsPieces(position[0], piece);
        return !isContain;
    }
    return true;
  }
}

// セルクラス
class Cell {
  constructor(position, piece = null) {
    this.position = position;
    this.piece = piece;
    this.isSelect = false;
    this.isMoveable = false;
    this.createElement();
    this.addClickListener();
  }

  createElement() {
    this.element = document.createElement('button');
    this.element.classList.add('cell');
    this.element.textContent = this.piece ? this.piece.name : BLANK_MARK;
  }

  addClickListener() {
    this.element.addEventListener("click", () => {
      // 駒を持たずに空のセルをクリックしたら何もしない
      if (pauseGame) {
        return;
      }
  
      // 駒を選択する
      if (this.piece && this.piece.team == nowTeam) {
        nowSelectCell = this;
        const moveablePositions = this.piece.moveable();
        cellManamger.resetCellsState();
        cellManamger.setCellsMoveableState(moveablePositions);
        updateDisplayHoldPieces();
        this.setSelectState(true);
        return;
      }
  
      // 駒を配置する
      if (!this.piece && PieceManager.checkCanPlacing(nowSelectHoldPiece, this.position)) {
        nowSelectHoldPiece.position = this.position;
        this.setPiece(nowSelectHoldPiece);
        removePieceFromHold(nowSelectHoldPiece);
        nextTeam();
        return;
      }
  
      // 駒を移動する
      cellManamger.movePieceAtCell(nowSelectCell, this);
    });
  }
  

  setSelectState(state) {
    this.isSelect = state;
    this.updateClass();
  }

  setMoveableState(state) {
    this.isMoveable = state;
    this.updateClass();
  }

  setPiece(piece) {
    this.piece = piece;
    piece.move(this.position);
    this.element.textContent = this.piece ? this.piece.name : BLANK_MARK;
  }

  removePiece() {
    this.piece = null;
    this.element.textContent = BLANK_MARK;
  }

  movePiece(piece) {
    if (piece && this.isMoveable) {
      this.setPiece(piece);
      return true;
    }
    return false;
  }

    
  updateClass() {
    this.element.classList.toggle('select-cell', this.isSelect);
    this.element.classList.toggle('moveable-cell', this.isMoveable);
    const piece = this.piece;
    if (piece) {
      this.element.classList.toggle('piece-major', piece.isMajorPiece);
      this.element.classList.toggle('piece-promote', piece.isPromote);
      this.element.classList.toggle('team-false', !piece.team);
      this.element.classList.toggle('team-true', piece.team);
    }
  }
}

class CellManamger {
  constructor() {
    this.cells = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }));
    this.initializeCells();
  }

  initializeCells() {
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const [row, col] = Board.convPositionToIndex([x, y])
        this.cells[row][col] = new Cell([row, col]);
      }
    }
  }

  movePieceAtCell(beforeCell, targetCell) {
    const beforePiece = beforeCell?.piece;
    const targetPiece = targetCell?.piece;

    const winTeam = targetPiece?.constructor == King ? !targetPiece?.team : null;

    if (!beforeCell || !targetCell || !beforePiece || !targetCell.isMoveable) {
      return;
    }

    if (targetPiece && beforePiece.team != targetPiece.team && winTeam == null) {
      addHoldPieceToNowTeam(targetPiece);
    }
   
    beforeCell.removePiece();

    if (winTeam != null) {
      checkmate(winTeam);
    }

    const canPromote = this.checkCanPromote(targetCell.position, beforePiece.team, beforePiece);
    if (canPromote) {
      const isCanMove = PieceManager.checkCanMoveInsideBoard(beforePiece, targetCell.position);
      if (isCanMove) {
        Board.displayPromoteButtons(beforePiece, targetCell);
      } else {
        Board.promotePiece(true, beforePiece, targetCell);
      }
    } else {
      targetCell.setPiece(beforePiece);
      nextTeam();
    }
  }

  checkCanPromote(position, team, piece) {
    if (!PieceManager.checkCanPromotePiece(piece) || !position){
      return false;
    }
    const isInCamp = (team && position[1] <= 2) || (!team && position[1] >= 6);
    const isOutCamp = (team && piece.position[1] <= 2) || (!team && piece.position[1] >= 6);
    return isInCamp || isOutCamp;
  }

  getCell(position) {
    if (Board.checkInBoard(position)) {
      const [x, y] = position;
      return this.cells[x][y];
    }
  }

  checkIncludePiece(position) {
    if (!Board.checkInBoard(position)) {
      return [true, true];
    }
    const piece = this.getCell(position)?.piece;

    const isInclude = piece != null;
    const isIncludeAlay = piece ? piece.team == nowTeam : false;

    return [isInclude, isIncludeAlay];
  }

  setPiece(piece, position) {
    const cell = this.getCell(position);
    if (cell.piece) {
      throw new Error("Cell is already occupied by a piece");
    } else {
      cell.setPiece(piece);
    }
  }

  setNewPiece(pieceClass, position, team) {
    this.setPiece(PieceManager.createNewPiece(pieceClass, position, team), position);
  }

  setCellsMoveableState(positions) {
    positions.forEach(pos => {
      const cell = this.getCell(pos);
      if (cell) {
        cell.setMoveableState(true);
      }
    });
  }

  resetCellsState() {
    this.cells.forEach(row => {
      row.forEach(cell => {
        if (cell) {
          cell.setMoveableState(false);
          cell.setSelectState(false);
        }
      });
    });
    nowSelectHoldPiece = null;
  }
}
const cellManamger = new CellManamger()

// ピースクラス
class Piece {
  constructor(normalName, promoteName, isMajorPiece=false, position = null, team = false, isAlive = false, isPromote = false) {
    this.name = this.isPromote ? promoteName : normalName;
    this.normalName = normalName;
    this.promoteName = promoteName;
    this.isMajorPiece = isMajorPiece;
    this.position = position;
    this.isAlive = isAlive;
    this.isPromote = isPromote;
    this.team = team;
  }

  setPromoteState(state) {
    this.isPromote = state;
    this.name = this.isPromote ? this.promoteName : this.normalName;
  }

  // 駒の移動可能な位置を返すメソッド
  moveable() {
    switch (this.isPromote) {
      case false:
        return this.getNormalMoveable();
      case true:
        return this.getPromotedMoveable();
    }
  }

  getNormalMoveable() {
    return null;
  }

  getPromotedMoveable() {
    if (this.isMajorPiece) {
      let moveables = this.getNormalMoveable();
      const aroundMoveables = this.around();
      const uniqueMoveables = new Set([...moveables, ...aroundMoveables]);
      return [...uniqueMoveables];
    } else {
      const moveDirections = [DIRECTIONS.UP, DIRECTIONS.UPRIGHT, DIRECTIONS.UPLEFT, DIRECTIONS.RIGHT, DIRECTIONS.LEFT, DIRECTIONS.DOWN];
      return this.front(moveDirections);
    }
  }

  // 駒を指定された位置に移動させるメソッド
  move(position) {
    // ボード内に位置があり、現在の位置と異なる場合にのみ移動を許可
    const inBoard = Board.checkInBoard(position) && position !== this.position;
    if (inBoard) {
      this.position = position;
    }
  }

  // 指定された位置を調整し、チームの移動制約を考慮するメソッド
  adjustPosition(position, currentPosition, isList = false) {
    if (!position || !currentPosition) {
      return null;
    }

    let positions = isList ? position : [position];
    let posList = Board.addPosition(currentPosition, positions);
    posList = this.returnMoveableByTeam(posList, currentPosition);
    posList = this.removeOverlapsAlay(posList);
    return isList ? posList : posList[0];
  }


  // チームに応じて移動可能な位置を調整するメソッド
  returnMoveableByTeam(positions, currentPosition) {
    if (this.team) {
      const [teamX, teamY] = currentPosition;
      return positions.map(([x, y]) => [2 * teamX - x, 2 * teamY - y]);
    } else {
      return positions;
    }
  }  
  

  removeOverlapsAlay(positions) {
    let posList = [];
    positions.forEach(pos => {
      const [, isIncludeAlay] = cellManamger.checkIncludePiece(pos);
      if (pos && !isIncludeAlay) {
        posList.push(pos);
      }
    });
    return posList;
  }

  // 1マス以内の移動可能な位置を返すメソッド
  around(currentPosition = this.position) {
    let moveableList = [];
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if (x !== 0 || y !== 0) {
          const pos = this.adjustPosition([x, y], currentPosition);
          moveableList.push(pos);
        }
      }
    }
    return moveableList;
  }

  // 直線方向の移動可能な位置を返すメソッド
  straight(directions, currentPosition = this.position) {
    let moveableList = [];
    const maxCount = BOARD_SIZE;
    for (const direction in directions) {
      let loopCount = 0;
      const { x, y } = directions[direction];
      while (loopCount < maxCount) {
        loopCount++;
        const pos = this.adjustPosition([x * loopCount, y * loopCount], currentPosition);
        const [isInclude, isIncludeAlay] = cellManamger.checkIncludePiece(pos);

        if (isIncludeAlay) {
          break;
        }
        moveableList.push(pos);
        if (isInclude) {
          break;
        }
      }
    }
    return moveableList;
  }

  // 前方の移動可能な位置を返すメソッド
  front(directions, currentPosition = this.position) {
    let moveableList = [];
    for (const direction in directions) {
      const { x, y } = directions[direction];
      const pos = this.adjustPosition([x, y], currentPosition);
      moveableList.push(pos);
    }
    return moveableList;
  }
}

class King extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    const name = !team ? "王" : "玉";
    super(name, "", true, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    return this.around(currentPosition);
  }
}

class Bishop extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("角", "馬", true, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [DIRECTIONS.UPRIGHT, DIRECTIONS.DOWNRIGHT, DIRECTIONS.DOWNLEFT, DIRECTIONS.UPLEFT];
    return this.straight(moveDirections, currentPosition);
  }
}

class Rook extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("飛", "竜", true, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [DIRECTIONS.UP, DIRECTIONS.RIGHT, DIRECTIONS.DOWN, DIRECTIONS.LEFT];
    return this.straight(moveDirections, currentPosition);
  }
}

class Gold extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("金", "", false, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [DIRECTIONS.UP, DIRECTIONS.UPRIGHT, DIRECTIONS.UPLEFT, DIRECTIONS.RIGHT, DIRECTIONS.LEFT, DIRECTIONS.DOWN];
    return this.front(moveDirections, currentPosition);
  }
}

class Silver extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("銀", "成銀", false, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [DIRECTIONS.UP, DIRECTIONS.UPRIGHT, DIRECTIONS.UPLEFT, DIRECTIONS.DOWNRIGHT, DIRECTIONS.DOWNLEFT];
    return this.front(moveDirections, currentPosition);
  }
}

class Knight extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("桂", "成桂", false, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveableList = [[1, 2],[-1, 2]];
    return this.adjustPosition(moveableList, currentPosition, true);
  }
}

class Lance extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("香", "成香",false, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [ DIRECTIONS.UP ];
    return this.straight(moveDirections, currentPosition);
  }
}

class Pawn extends Piece {
  constructor(position=null, team=false, isAlive=true) {
    super("歩", "と", false, position, team, isAlive);
  }

  getNormalMoveable(currentPosition = this.position) {
    const moveDirections = [DIRECTIONS.UP];
    return this.front(moveDirections, currentPosition);
  }
}

const nextTeam = () => {
  nowTeam = !nowTeam;
  nowSelectCell = null;
  nowSelectHoldPiece = null;
  cellManamger.resetCellsState();
  updateDisplayHoldPieces();
}

const addHoldPieceToNowTeam = (piece) => {
  if (!piece) {
    return;
  }
  const newPiece = PieceManager.createNewPiece(piece.constructor, null, !piece.team, false);
  
  switch (nowTeam) {
    case false:
      teamFlaseHoldPiece.push(newPiece);
      break;
    case true:
      teamTrueHoldPiece.push(newPiece);
      break;
  }
  updateDisplayHoldPieces();
}

const removePieceFromHold = (removePiece) => {
  if (!removePiece || removePiece.team == null || removePiece.team == undefined) {
    return;
  }
  const team = removePiece.team;
  switch (team) {
    case false:
      teamFlaseHoldPiece = teamFlaseHoldPiece.filter(piece => piece != removePiece);
      break;
    case true:
      teamTrueHoldPiece = teamTrueHoldPiece.filter(piece => piece != removePiece);
      break;
  }
  updateDisplayHoldPieces();
}

// 持ち駒を表示する関数
const updateDisplayHoldPieces = () => {
  createHoldPiecesElement('team-false-hold-piece', teamFlaseHoldPiece);
  createHoldPiecesElement('team-true-hold-piece', teamTrueHoldPiece);
};

const holdPieceClickHandler = (piece) => {
  if (!piece || piece.team !== nowTeam || pauseGame) {
    return;
  }
  cellManamger.resetCellsState();
  nowSelectCell = null;
  nowSelectHoldPiece = piece;
  updateDisplayHoldPieces();
};

const createHoldPiecesElement = (elementId, holdPieces) => {
  const parentElement = document.getElementById(elementId);
  if (!parentElement) {
    return;
  }
  parentElement.innerHTML = '';
  holdPieces.forEach(piece => {
    const pieceElement = document.createElement('button');
    pieceElement.textContent = piece.name;
    if (piece === nowSelectHoldPiece) {
      pieceElement.classList.add('hold-button-select');
    } else {
      pieceElement.addEventListener('click', () => holdPieceClickHandler(piece)); // クリック時のイベントを追加
    }
    parentElement.appendChild(pieceElement);
  });
  return parentElement;
};

// ゲームの初期化
const initializeGame = () => {
  Board.createBoard(cellManamger.cells);
  PieceManager.initializeSetPiece();
  cellManamger.resetCellsState();
  updateDisplayHoldPieces();
};
initializeGame();

const checkmate = (winTeam) => {
  pauseGame = true;
  const winningTeamDisplay = document.getElementById('winning-team-display');
  winningTeamDisplay.textContent = `${winTeam ? '後手' : '先手'}の勝利！`;
  winningTeamDisplay.style.display = 'flex';
}

// 新しいゲームを開始する関数
const startNewGame = () => {
  console.log("初期化");
  // ゲーム状態を初期化
  nowTeam = false;
  nowSelectCell = null;
  nowSelectHoldPiece = null;
  teamFlaseHoldPiece = [];
  teamTrueHoldPiece = [];
  pauseGame = false;

  // ボードをリセット
  const board = document.getElementById('board');
  board.innerHTML = '';
  cellManamger.initializeCells();
  PieceManager.initializeSetPiece();

  // セルの状態をリセット
  cellManamger.resetCellsState();

  // 持ち駒を更新して表示
  updateDisplayHoldPieces();

  // ゲームを初期化して開始
  initializeGame();
};
