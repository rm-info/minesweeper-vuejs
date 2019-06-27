<template>
  <v-content class="pa-0 ma-0">
    <v-container grid-list-lg>
      <v-layout row wrap justify-center>
        <v-flex xs12 class="text-xs-center">
            <img :src="require('@/assets/logo.png')"/>
        </v-flex>

        <v-flex v-for="(topic, idx) in topics" :key="idx">
          <h3 class="title">{{topic.title}}</h3>
          <v-list class="mt-2">
            <v-list-tile v-for="(listItem, idx) in topic.list" :key="idx">
              <v-divider v-if="listItem === '---'"></v-divider>
              <v-list-tile-content v-else v-html="listItem"></v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>
export default {
  data () {
    return {
      topics: [
        {
          title:"Rules",
          list:[
            "A field is full of mines waiting for your foot pushing it to blow up.",
            "Find all the mines to win",
            "Don't die..",
            "Play again to try to beat the clock",
            "---",
            "<span><u>Don't come here while your game is on, because you'll lose everything!</u></span>"
          ],
        },
        {
          title:"How to play",
          list:[
            "The field is pictured as a board of tiles or cells.",
            "Start with choosing your field dimensions.",
            "The third input let you customize the density of mines in the field.",
            "<span><i><u>Remember:</u> The more mines you want, the harder it will be.</i></span>",
            "<span>Then <b>Start</b>!</span>",
            "The number of mines you still have to find is shown",
            "A counter tells you how many seconds you spent on your game",
            "---",
            "<span><b>Left click</b> on the tile you want to reveal</span>",
            "<span><b>Right click</b> on a tile to set a flag, meaning you think there's a mine there</span>",
            "<span><b>Middle click</b> or <b>Double click</b> on a revealed tile to find out what's around</span>",
            "---",
            "<span><b>Start</b> cancels any current game and starts a new one with custom settings</span>",
            "<span><b>Reset</b> cancels any current game and reset the settings to default</span>",
            "<span><b>Resolve</b> ends the game (meaning you lose) and shows the entire field</span>"
          ]
        },
        {
          title:"More...",
          list:[
            "Found a bug? No kidding...",
            "If you know how to manage right and left click simultaneously, contact me",
            "<span>Why this logo? Because it's made with <a href='https://vuejs.org/' target='_blank' title='Vue.js'><img width='24px' src='https://vuejs.org/images/logo.png?_sw-precache=cf23526f451784ff137f161b8fe18d5a'/></a></span>",
            "---",
            "<span><u>Upcoming:</u> Scores saving and best scores board</span>",
            "---",
            "<span>-- <a href='https://github.com/rm-info/minesweeper-vuejs.git' target='_blank'>Github Repo</a> --</span>",
          ],
        },
      ]
    }
  },
}
</script>
