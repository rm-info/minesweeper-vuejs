<template>
  <v-content class="pa-0 ma-0">
    <v-container grid-list-lg>
      <v-form @submit.prevent="startNewGame()">
        <v-layout row wrap justify-center>
          <v-flex>
            <v-text-field v-model.number="width.value" label="Width" clearable validate-on-blur
            :rules="width.rules"></v-text-field>
          </v-flex>
          <v-flex>
            <v-text-field v-model.number="height.value" label="Height"></v-text-field>
          </v-flex>
          <v-flex>
            <v-text-field v-model.number="percMines.value" label="% of mines"></v-text-field>
          </v-flex>
          <v-flex>
            <v-btn color="success" type="submit">Start</v-btn>
            <v-btn color="error" @click="resetToDefault()">Reset</v-btn>
            <v-btn color="warning" @click="solveGame()">Solve</v-btn>
          </v-flex>
        </v-layout>
      </v-form>
      <span style="z-index:2;position:fixed;right:0;top:0">
        <v-btn @click="zoom < 4 ? zoom+=0.5 : zoom=4.5" icon><v-icon>zoom_in</v-icon></v-btn>
        {{zoom-0.5 | dec2}}x
        <v-btn @click="zoom > 2 ? zoom-=0.5 : zoom=1.5" icon><v-icon>zoom_out</v-icon></v-btn>
      </span>

    </v-container>
    <v-container grid-list-xs>
      <v-layout row wrap justify-center>
        <v-flex xs12 v-if="gameOver && board[0]">
          <p class="display-4 red--text text-xs-center">Game Over !</p>        
        </v-flex>
        <v-flex xs12 v-if="gameWon">
          <p class="display-4 success--text text-xs-center">
            <!-- <v-icon class="success--text" style="font-size:1em;">thumb_up_alt</v-icon>  -->
            You Won! 
            <!-- <v-icon class="success--text" style="font-size:1em;">thumb_up_alt</v-icon> -->
          </p>        
        </v-flex>
        <v-flex xs6 v-if="nbMinesLeft !== null">
          <p class="subheading text-xs-center">Nb mines left: {{nbMinesLeft}}</p>        
        </v-flex>
        <v-flex xs6 v-if="time !== null">
          <p class="subheading text-xs-center">Elapsed time: {{time}}s</p>        
        </v-flex>

        <table class="pa-0 ma-0">
          <tr v-for="(line, idx) in board" :key="idx" class="pa-0 ma-0">
            <td v-for="(cell, idy) in line" :key="idy" class="pa-0 ma-0">
              <v-btn :color="!cell.flipped ? cell.color : 'grey'" small class="pa-0 ma-0 cell" 
                :style="{minWidth:zoom+'em',minHeight:zoom+'em',width:zoom+'em',height:zoom+'em',maxWidth:zoom+'em',maxHeight:zoom+'em'}" 
                @click.left="flipCell(cell)"
                @click.right.prevent="flagCell(cell)"
                @click.middle.prevent="discoverAroundCells(cell)"
                 :title="'('+cell.coord.x+','+cell.coord.y+')'">
                <span v-if="!cell.flipped">
                  <v-icon v-if="cell.icon" class="cellIcon pa-0 ma-0" :style="{fontSize:zoom+'em'}">{{cell.icon}}</v-icon>
                  <span v-if="cell.value > 0" :style="{fontSize:zoom+'em'}">{{cell.value}}</span>
                </span>
                <span v-else>
                  <v-icon v-if="cell.flag" :style="{fontSize:zoom+'em'}">flag</v-icon>
                </span>
              </v-btn>
            </td>
          </tr>
        </table>
        <h1 class="display-3 ma-5 pa-5" v-if="board.length===0">Click on Start to play!</h1>
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>
  import HelloWorld from '../components/HelloWorld'
  import { setInterval, clearInterval } from 'timers';

  export default {
    components: {
    },
    data () {
      return {
        width: {value:10, rules:[], default:10},
        height: {value:10, rules:[], default:10},
        defHeight: 10,
        percMines: {value:10, rules:[], default:10},
        board:[],
        zoom:1.5,
        nbMinesLeft:null,
        gameOver:true,
        gameWon:false,
        time:null,
        stopTime:null,
      }
    },
    filters: {
      dec2 (e) {
        return Math.round(e*100)/100;
      }
    },
    watch: {
      nbMinesLeft (val) {
        if (val == 0) {
          this.checkEndOfGame();
        }
      },
    },
    methods: {
      startNewGame() {
        this.board = [];
        for (let i = 0; i < this.height.value; i++) {
          this.board.push([]);
          for (let j = 0; j < this.width.value; j++) {
            this.board[i].push({value:0, icon:'', color:"green lighten-4", flipped:true, coord:{x:j, y:i}, flag:false});
          }
        }
        if (this.percMines.value > 100)  this.percMines.value = 100;
        if (this.percMines.value < 1)  this.percMines.value = 1;
        console.log("percMines",this.percMines.value, typeof this.percMines.value, this.percMines.value/100);
        console.log("width x height", this.width.value, 'x', this.height.value);
        this.nbMinesLeft = Math.ceil((this.percMines.value/100)*this.width.value*this.height.value);
        console.log("minesLeft",this.nbMinesLeft);
        this.gameOver = false;
        this.gameWon = false;
        this.time = 0;
        clearInterval(this.stopTime);
        this.initBoard();
      },
      resetToDefault() {
        this.width.value = this.width.default;
        this.height.value = this.height.default;
        this.percMines.value = this.percMines.default;
        this.board = [];
        this.nbMinesLeft = null;
        this.gameOver = true;
        this.gameWon = false;
        this.time = null;
        clearInterval(this.stopTime);
      },
      aroundCells (cell) {
        debugger;
        let x = cell.coord.x;
        let y = cell.coord.y;
        let initCoords = [{x:x-1,y:y-1},{x:x,y:y-1},{x:x+1,y:y-1},{x:x-1,y:y},{x:x+1,y:y},{x:x-1,y:y+1},{x:x,y:y+1},{x:x+1,y:y+1}];
        let aroundCells = [];
        initCoords.forEach((coord, idx) => {
          if (coord.x >= 0 && coord.x < this.width.value && coord.y >= 0 && coord.y < this.height.value) {
            aroundCells.push(this.board[coord.y][coord.x]);
          }
        });      
        // console.log("aroundCells.size:",aroundCells.length);  
        // console.log("aroundCells:",aroundCells);  
        return aroundCells;
      },
      initBoard() {
        // console.log("init Board");
        let i = 0;
        while (i < this.nbMinesLeft) {  // while we still have mines to put on the field
          // calculate a new position somewhere in the array
          let newMine = Math.floor(Math.random()*Math.floor(this.width.value*this.height.value)); 
          // console.log("Mine pos:",newMine);
          // deduce the coordinates (this way we only call random once which I assume is pretty expensive (more than floor anyway))
          let y = Math.floor(newMine/this.width.value);
          let x = newMine-Math.floor(newMine/this.width.value)*this.width.value;
          // console.log("x:y=",x,":",y);
          let cell = this.board[y][x];
          if (cell.value !== '-1') {  // if the cell doesn't already have a mine,
            cell.value = '-1';        // put it there
            cell.icon = 'whatshot';
            cell.color = 'warning';
            this.aroundCells(cell).forEach((newCell) => {
              if (newCell.value > -1) { // then update the cells around so they know the new mine is close.
                newCell.value++;
                this.setColor(newCell); // and update the color at the same time.
              }
            });
            i++;  // we added a new mine, so one more done
          }
        }
        this.stopTime = setInterval(() => {
          this.time++;
        }, 1000);
      },
      setColor(cell) {
        switch(cell.value) {  // select the good background color according to the value of the cell
          case 0: cell.color = "green lighten-4"; break;
          case 1: cell.color = "green lighten-3"; break;
          case 2: cell.color = "green lighten-2"; break;
          case 3: cell.color = "green lighten-1"; break;
          case 4: cell.color = "green";           break;
          case 5: cell.color = "green darken-1";  break;
          case 6: cell.color = "green darken-2";  break;
          case 7: cell.color = "green darken-3";  break;
          case 8: cell.color = "green darken-4";  break;
        }
      },
      flipCell(cell) {  // this function "flips" the tile over to reveal its content
        if (this.gameOver || this.gameWon)  return; // game is over or won, nothing to do
        if (!cell.flipped)  return; // cell is already flipped over, nothing to do
        if (cell.flag) {            // cell is flagged, 
          // cell.flag = !cell.flag;   // we give a chance and just unflag.
          // this.nbMinesLeft++;       // and increase the number of left mines otherwise there's no end..
          return;                   // nothing to do
        }
        cell.flipped = false;       // flip the cell
        if (cell.value == -1) {     // if it's a mine BOUM!
          this.gameOver = true;
          clearInterval(this.stopTime);
          // alert('Game Over!!!');
          console.log("GameOver!!");
          return;
        }
        if (cell.value === 0) {     // if empty cell, we discover the cells around
          this.aroundCells(cell).forEach((newCell) => {
            this.flipCell(newCell);  // with recursivity
          });
        }
      },
      flagCell(cell) {  // this function set a flag on a potential mined cell
        if (this.gameOver || this.gameWon)  return; // game is over, nothing to do
        if (!cell.flipped)  return; // cell already revealed, nothing to do
        cell.flag = !cell.flag;     // revert the flag value
        cell.flag ? this.nbMinesLeft-- : this.nbMinesLeft++;  // manages the counter according to the new flag
      },
      discoverAroundCells(cell) {
        console.log("middleClick");
        if (this.gameOver || this.gameWon)  return; // game is over, nothing to do
        if (cell.flipped) return;       // cell not yet discovered, nothing to do
        if (cell.flag) return;          // cell is flagged, nothing to do
        let foundFlags = 0;
        let aroundCells = this.aroundCells(cell);
        aroundCells.forEach((newCell) => {
          if (newCell.flag) foundFlags++;
        });
        if (cell.value == foundFlags) {
          aroundCells.forEach((newCell) => {
            this.flipCell(newCell);
          });
        }
      },
      checkEndOfGame () { // this function checks if every flag has been found at the proper location
        console.log("checkEndOfGame");
        for (let i = 0; i < this.height.value; i++) {
          for (let j = 0; j < this.width.value; j++) {  // we just run over the whole array
            let cell = this.board[i][j];
            if ((cell.value == -1 && !cell.flag)) { // and check if there's a flag on mined cells
              console.log("game is not finished because:",cell.value,"!=",-1,"or",cell.flag,"!=",true);
              return;   // if not, nothing happens
            }
          }
        }
        // if everything is done, 
        clearInterval(this.stopTime);
        this.gameWon = true;
        for (let i = 0; i < this.height.value; i++) {
          for (let j = 0; j < this.width.value; j++) {  // we just run over the whole array
            let cell = this.board[i][j];
            if (cell.value > -1 && cell.flipped)  cell.flipped = !cell.flipped;
          }
        }
        console.log("You won!");
      },
      cellClickAction(cell) {
        switch(cell.color) {
          case "success":
            cell.color = "primary";
            cell.icon = "flag";
            break;
          case "primary":
            cell.color = "error";
            cell.icon = "";
            break;
          case "error":
            cell.color = "warning";
            cell.icon = "whatshot";
            break;
          case "warning":
            cell.color = "info";
            cell.icon = "looks_one";
            break;
          case "info":
            switch(cell.icon) {
              case "looks_one":
                cell.icon = "looks_two";
              break;
              case "looks_two":
                cell.icon = "looks_3";
              break;
              case "looks_3":
                cell.icon = "looks_4";
              break;
              case "looks_4":
                cell.icon = "looks_5";
              break;
              case "looks_5":
                cell.icon = "looks_6";
              break;
              default:
                cell.color = "success";
                cell.icon = "";
            }
            break;
          default:
            cell.color = "success";
            cell.icon = "";
        }
      },
      solveGame () {
        if (!this.board[0]) return;
        this.gameOver = true;
        for (let i = 0; i < this.height.value; i++) {
          for (let j = 0; j < this.width.value; j++) {  // we just run over the whole array
            let cell = this.board[i][j];
            cell.flipped = false;
          }
        }
      },
    },
  }
</script>
<style lang="scss" scoped>
  // $val:1.6em;
  // .cell {
  //   min-width:$val;
  //   width:$val;
  //   max-width:$val;
  //   min-height:$val;
  //   height:$val;
  //   max-height:$val;  
  // }

  // .cellIcon {
  //   font-size: $val;
  // }
</style>
