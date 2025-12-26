<template>
  <v-main class="pa-0 ma-0">
    <v-container>
      <v-form @submit.prevent="startNewGame()">
        <v-row justify="center">
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model.number="width.value"
              label="Width"
              type="number"
              :error-messages="widthErrors"
              @input="v$.width.value.$touch()"
              @blur="v$.width.value.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model.number="height.value"
              label="Height"
              type="number"
              :error-messages="heightErrors"
              @input="v$.height.value.$touch()"
              @blur="v$.height.value.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model.number="percMines.value"
              label="% of mines"
              type="number"
              :error-messages="percMinesErrors"
              @input="v$.percMines.value.$touch()"
              @blur="v$.percMines.value.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" class="text-center">
            <v-btn color="success" type="submit">Start</v-btn>
            <v-btn color="error" @click="resetToDefault()" class="mx-2">Reset</v-btn>
            <v-btn color="warning" @click="solveGame()">Solve</v-btn>
          </v-col>
          <v-col cols="12" class="text-center">
            <v-btn @click="zoom < 4 ? zoom+=0.5 : zoom=4.5" icon>
              <v-icon>mdi-magnify-plus</v-icon>
            </v-btn>
            <span class="mx-2">{{ dec2(zoom-0.5) }}x</span>
            <v-btn @click="zoom > 2 ? zoom-=0.5 : zoom=1.5" icon>
              <v-icon>mdi-magnify-minus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-container>

    <v-container>
      <v-row justify="center">
        <v-col cols="12" v-if="gameOver && board[0]">
          <p class="text-h4 text-red text-center">Game Over !</p>
        </v-col>
        <v-col cols="12" v-if="gameWon">
          <p class="text-h4 text-success text-center">You Won!</p>
        </v-col>
        <v-col cols="6" v-if="nbMinesLeft !== null">
          <p class="text-subtitle-1 text-center">Nb mines left: {{ nbMinesLeft }}</p>
        </v-col>
        <v-col cols="6" v-if="time !== null">
          <p class="text-subtitle-1 text-center">Elapsed time: {{ time }}s</p>
        </v-col>

        <v-col cols="12" class="d-flex justify-center">
          <table class="pa-0 ma-0">
            <tr v-for="(line, idx) in board" :key="idx" class="pa-0 ma-0">
              <td v-for="(cell, idy) in line" :key="idy" class="pa-0 ma-0">
                <v-btn
                  :color="!cell.flipped ? cell.color : 'grey'"
                  size="small"
                  class="pa-0 ma-0 cell"
                  :style="{minWidth:zoom+'em',minHeight:zoom+'em',width:zoom+'em',height:zoom+'em',maxWidth:zoom+'em',maxHeight:zoom+'em'}"
                  @dblclick.left.prevent="discoverAroundCells(cell)"
                  @click.left.prevent="flipCell(cell)"
                  @click.right.prevent="flagCell(cell)"
                  @click.middle.prevent="discoverAroundCells(cell)"
                >
                  <span v-if="!cell.flipped">
                    <v-icon v-if="cell.icon" class="cellIcon pa-0 ma-0" :style="{fontSize:zoom+'em'}">mdi-{{ cell.icon }}</v-icon>
                    <span v-if="cell.value > 0" :style="{fontSize:zoom+'em'}">{{ cell.value }}</span>
                  </span>
                  <span v-else>
                    <v-icon v-if="cell.flag" :style="{fontSize:zoom+'em'}">mdi-flag</v-icon>
                  </span>
                </v-btn>
              </td>
            </tr>
          </table>
        </v-col>
        <v-col cols="12" v-if="board.length===0">
          <h1 class="text-h3 text-center">Click on Start to play!</h1>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, reactive, computed, watch, onActivated, onDeactivated } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, numeric, between } from '@vuelidate/validators'

const MINE_VALUE = -1
const EMPTY_CELL = 0

// Data
const width = reactive({ value: 10, default: 10 })
const height = reactive({ value: 10, default: 10 })
const percMines = reactive({ value: 10, default: 10 })
const board = ref([])
const zoom = ref(1.5)
const nbMinesLeft = ref(null)
const gameOver = ref(true)
const gameWon = ref(false)
const time = ref(null)
const stopTime = ref(null)
const isPaused = ref(false)

// Validation rules
const rules = {
  width: { value: { required, numeric, between: between(2, 40) } },
  height: { value: { required, numeric, between: between(2, 40) } },
  percMines: { value: { required, numeric, between: between(1, 100) } }
}

const v$ = useVuelidate(rules, { width, height, percMines })

// Computed
const widthErrors = computed(() => {
  const errors = []
  if (!v$.value.width.value.$dirty) return errors
  !v$.value.width.value.required && errors.push('is required and must be numeric')
  !v$.value.width.value.numeric && errors.push('must be a positive integer')
  !v$.value.width.value.between && errors.push('must be between 2 and 40')
  return errors
})

const heightErrors = computed(() => {
  const errors = []
  if (!v$.value.height.value.$dirty) return errors
  !v$.value.height.value.required && errors.push('is required and must be numeric')
  !v$.value.height.value.numeric && errors.push('must be a positive integer')
  !v$.value.height.value.between && errors.push('must be between 2 and 40')
  return errors
})

const percMinesErrors = computed(() => {
  const errors = []
  if (!v$.value.percMines.value.$dirty) return errors
  !v$.value.percMines.value.required && errors.push('is required and must be numeric')
  !v$.value.percMines.value.numeric && errors.push('must be a positive integer')
  !v$.value.percMines.value.between && errors.push('must be between 1 and 100')
  return errors
})

// Watch
watch(() => nbMinesLeft.value, (val) => {
  if (val === 0) {
    checkEndOfGame()
  }
})

// Methods
function dec2(e) {
  return Math.round(e * 100) / 100
}

function startNewGame() {
  v$.value.$touch()
  if (widthErrors.value.length || heightErrors.value.length || percMinesErrors.value.length) return

  board.value = []
  for (let i = 0; i < height.value; i++) {
    board.value.push([])
    for (let j = 0; j < width.value; j++) {
      board.value[i].push({
        value: EMPTY_CELL,
        icon: '',
        color: "green-lighten-4",
        flipped: true,
        coord: { x: j, y: i },
        flag: false
      })
    }
  }
  nbMinesLeft.value = Math.ceil((percMines.value / 100) * width.value * height.value)
  gameOver.value = false
  gameWon.value = false
  time.value = 0
  clearInterval(stopTime.value)
  initBoard()
}

function resetToDefault() {
  v$.value.$reset()

  width.value = width.default
  height.value = height.default
  percMines.value = percMines.default
  board.value = []
  nbMinesLeft.value = null
  gameOver.value = true
  gameWon.value = false
  time.value = null
  clearInterval(stopTime.value)
}

function aroundCells(cell) {
  let x = cell.coord.x
  let y = cell.coord.y
  let initCoords = [
    { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
    { x: x - 1, y: y }, { x: x + 1, y: y },
    { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
  ]
  let cells = []
  initCoords.forEach((coord) => {
    if (coord.x >= 0 && coord.x < width.value && coord.y >= 0 && coord.y < height.value) {
      cells.push(board.value[coord.y][coord.x])
    }
  })
  return cells
}

function initBoard() {
  let i = 0
  while (i < nbMinesLeft.value) {
    let newMine = Math.floor(Math.random() * Math.floor(width.value * height.value))
    let y = Math.floor(newMine / width.value)
    let x = newMine - Math.floor(newMine / width.value) * width.value
    let cell = board.value[y][x]
    if (cell.value !== MINE_VALUE) {
      cell.value = MINE_VALUE
      cell.icon = 'fire'
      cell.color = 'warning'
      aroundCells(cell).forEach((newCell) => {
        if (newCell.value > MINE_VALUE) {
          newCell.value++
          setColor(newCell)
        }
      })
      i++
    }
  }
  stopTime.value = setInterval(() => {
    if (!isPaused.value) {
      time.value++
    }
  }, 1000)
}

function pauseGame() {
  if (!gameOver.value && !gameWon.value && time.value !== null) {
    isPaused.value = true
  }
}

function resumeGame() {
  if (!gameOver.value && !gameWon.value && time.value !== null) {
    isPaused.value = false
  }
}

// Pause game when component is deactivated (navigating away)
onDeactivated(() => {
  pauseGame()
})

// Resume game when component is reactivated (coming back)
onActivated(() => {
  resumeGame()
})

function setColor(cell) {
  switch (cell.value) {
    case EMPTY_CELL: cell.color = "green-lighten-4"; break
    case 1: cell.color = "green-lighten-3"; break
    case 2: cell.color = "green-lighten-2"; break
    case 3: cell.color = "green-lighten-1"; break
    case 4: cell.color = "green"; break
    case 5: cell.color = "green-darken-1"; break
    case 6: cell.color = "green-darken-2"; break
    case 7: cell.color = "green-darken-3"; break
    case 8: cell.color = "green-darken-4"; break
  }
}

function flipCell(cell) {
  if (gameOver.value || gameWon.value) return
  if (!cell.flipped) return
  if (cell.flag) {
    return
  }
  cell.flipped = false
  if (cell.value === MINE_VALUE) {
    gameOver.value = true
    clearInterval(stopTime.value)
    return
  }
  if (cell.value === EMPTY_CELL) {
    aroundCells(cell).forEach((newCell) => {
      flipCell(newCell)
    })
  }
}

function flagCell(cell) {
  if (gameOver.value || gameWon.value) return
  if (!cell.flipped) return
  cell.flag = !cell.flag
  cell.flag ? nbMinesLeft.value-- : nbMinesLeft.value++
}

function discoverAroundCells(cell) {
  if (gameOver.value || gameWon.value) return
  if (cell.flipped) return
  if (cell.flag) return
  let foundFlags = 0
  let cells = aroundCells(cell)
  cells.forEach((newCell) => {
    if (newCell.flag) foundFlags++
  })
  if (cell.value === foundFlags) {
    cells.forEach((newCell) => {
      flipCell(newCell)
    })
  }
}

function checkEndOfGame() {
  for (let i = 0; i < height.value; i++) {
    for (let j = 0; j < width.value; j++) {
      let cell = board.value[i][j]
      if ((cell.value === MINE_VALUE && !cell.flag)) {
        return
      }
    }
  }
  clearInterval(stopTime.value)
  gameWon.value = true
  for (let i = 0; i < height.value; i++) {
    for (let j = 0; j < width.value; j++) {
      let cell = board.value[i][j]
      if (cell.value > MINE_VALUE && cell.flipped) cell.flipped = !cell.flipped
    }
  }
}

function solveGame() {
  if (!board.value[0]) return
  if (gameWon.value) return
  gameOver.value = true
  for (let i = 0; i < height.value; i++) {
    for (let j = 0; j < width.value; j++) {
      let cell = board.value[i][j]
      cell.flipped = false
    }
  }
}
</script>

<style lang="scss" scoped>
.cell {
  padding: 0 !important;
  margin: 1px !important;
  border-radius: 4px !important;
  min-width: unset !important;
  min-height: unset !important;
}

table {
  border-spacing: 0;
  border-collapse: collapse;
}

td {
  padding: 0;
  margin: 0;
  line-height: 0;
}
</style>
