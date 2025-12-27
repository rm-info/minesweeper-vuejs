<template>
  <v-main class="pa-0 ma-0">
    <v-container fluid class="py-2">
      <v-form @submit.prevent="startNewGame()">
        <v-row dense justify="center" align="center">
          <v-col cols="auto">
            <v-text-field
              v-model.number="width.value"
              label="Width"
              type="number"
              density="compact"
              hide-details="auto"
              :error-messages="widthErrors"
              @input="v$.width.value.$touch()"
              @blur="v$.width.value.$touch()"
              style="width: 100px"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model.number="height.value"
              label="Height"
              type="number"
              density="compact"
              hide-details="auto"
              :error-messages="heightErrors"
              @input="v$.height.value.$touch()"
              @blur="v$.height.value.$touch()"
              style="width: 100px"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model.number="percMines.value"
              label="% mines"
              type="number"
              density="compact"
              hide-details="auto"
              :error-messages="percMinesErrors"
              @input="v$.percMines.value.$touch()"
              @blur="v$.percMines.value.$touch()"
              style="width: 100px"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-btn color="success" type="submit" size="small">Start</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn color="error" @click="resetToDefault()" size="small">Reset</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn color="warning" @click="solveGame()" size="small">Solve</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn @click="zoom < 4 ? zoom+=0.5 : zoom=4.5" icon size="small" variant="text">
              <v-icon size="small">mdi-magnify-plus</v-icon>
            </v-btn>
            <span class="text-caption mx-1">{{ dec2(zoom-0.5) }}x</span>
            <v-btn @click="zoom > 2 ? zoom-=0.5 : zoom=1.5" icon size="small" variant="text">
              <v-icon size="small">mdi-magnify-minus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-container>

    <v-container fluid class="py-1">
      <v-row dense justify="center" align="center">
        <v-col cols="12" v-if="gameOver && board[0]">
          <p class="text-h5 text-red text-center ma-0">Game Over !</p>
        </v-col>
        <v-col cols="12" v-if="gameWon">
          <p class="text-h5 text-success text-center ma-0">You Won!</p>
        </v-col>
        <v-col cols="auto" v-if="nbMinesLeft !== null">
          <span class="text-body-2">💣 {{ nbMinesLeft }}</span>
        </v-col>
        <v-col cols="auto" v-if="time !== null">
          <span class="text-body-2">⏱️ {{ time }}s</span>
        </v-col>

        <v-col cols="12" class="d-flex justify-center">
          <div class="game-board">
            <div v-for="(line, idx) in board" :key="idx" class="board-row">
              <div
                v-for="(cell, idy) in line"
                :key="idy"
                class="cell"
                :class="{ 'cell-flipped': !cell.flipped, 'cell-covered': cell.flipped }"
                :style="{
                  width: zoom + 'em',
                  height: zoom + 'em',
                  backgroundColor: !cell.flipped ? getCellColor(cell.color) : '#9e9e9e'
                }"
                @dblclick.left.prevent="discoverAroundCells(cell)"
                @click.left.prevent="flipCell(cell)"
                @click.right.prevent="flagCell(cell)"
                @contextmenu.prevent
                @click.middle.prevent="discoverAroundCells(cell)"
              >
                <span v-if="!cell.flipped" class="cell-content" :style="{fontSize: zoom + 'em'}">
                  <span v-if="cell.icon" class="cell-icon">{{ getIconEmoji(cell.icon) }}</span>
                  <span v-else-if="cell.value > 0" class="cell-value">{{ cell.value }}</span>
                </span>
                <span v-else class="cell-content" :style="{fontSize: zoom + 'em'}">
                  <span v-if="cell.flag" class="cell-icon">🚩</span>
                </span>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12" v-if="board.length===0">
          <p class="text-h6 text-center text-grey">Click Start to play</p>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, watch, onActivated, onDeactivated, triggerRef } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, numeric, between } from '@vuelidate/validators'

const MINE_VALUE = -1
const EMPTY_CELL = 0

// Data
const width = reactive({ value: 10, default: 10 })
const height = reactive({ value: 10, default: 10 })
const percMines = reactive({ value: 10, default: 10 })
const board = shallowRef([])  // Shallow ref for better performance
const zoom = ref(1.5)
const nbMinesLeft = ref(null)
const gameOver = ref(true)
const gameWon = ref(false)
const time = ref(null)
const stopTime = ref(null)
const isPaused = ref(false)

// Validation rules
const maxCells = (value, siblings) => {
  return siblings.width.value * siblings.height.value <= 1000
}

const rules = {
  width: {
    value: {
      required,
      numeric,
      between: between(2, 40),
      maxCells: {
        $validator: maxCells,
        $message: 'Total cells (width × height) must not exceed 1000'
      }
    }
  },
  height: {
    value: {
      required,
      numeric,
      between: between(2, 40),
      maxCells: {
        $validator: maxCells,
        $message: 'Total cells (width × height) must not exceed 1000'
      }
    }
  },
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
  !v$.value.width.value.maxCells && errors.push('Max 1000 cells total (width × height)')
  return errors
})

const heightErrors = computed(() => {
  const errors = []
  if (!v$.value.height.value.$dirty) return errors
  !v$.value.height.value.required && errors.push('is required and must be numeric')
  !v$.value.height.value.numeric && errors.push('must be a positive integer')
  !v$.value.height.value.between && errors.push('must be between 2 and 40')
  !v$.value.height.value.maxCells && errors.push('Max 1000 cells total (width × height)')
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

// Helper functions for rendering
function getCellColor(colorName) {
  const colorMap = {
    'green-lighten-4': '#C8E6C9',
    'green-lighten-3': '#A5D6A7',
    'green-lighten-2': '#81C784',
    'green-lighten-1': '#66BB6A',
    'green': '#4CAF50',
    'green-darken-1': '#43A047',
    'green-darken-2': '#388E3C',
    'green-darken-3': '#2E7D32',
    'green-darken-4': '#1B5E20',
    'warning': '#FB8C00'
  }
  return colorMap[colorName] || '#9e9e9e'
}

function getIconEmoji(icon) {
  return icon === 'fire' ? '💥' : ''
}

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
    triggerRef(board)
    return
  }
  if (cell.value === EMPTY_CELL) {
    aroundCells(cell).forEach((newCell) => {
      flipCell(newCell)
    })
  }
  triggerRef(board)
}

function flagCell(cell) {
  if (gameOver.value || gameWon.value) return
  if (!cell.flipped) return
  cell.flag = !cell.flag
  cell.flag ? nbMinesLeft.value-- : nbMinesLeft.value++
  triggerRef(board)
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
.game-board {
  display: inline-block;
  user-select: none;
}

.board-row {
  display: flex;
  line-height: 0;
}

.cell {
  margin: 1px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.05s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);

  &:active {
    transform: scale(0.95);
  }

  &:hover {
    filter: brightness(1.1);
  }
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.cell-icon {
  font-size: 0.7em;
  line-height: 1;
}

.cell-value {
  font-size: 0.6em;
  line-height: 1;
  font-weight: bold;
}

.cell-covered {
  background: linear-gradient(135deg, #bdbdbd 0%, #9e9e9e 100%);
}

.cell-flipped {
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}
</style>
