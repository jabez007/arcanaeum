<template>
  <AppLayout>
    <span slot="toolbarTitle">Quotidian Schemer</span>
    <v-btn slot="toolbarItems" href="https://www.reddit.com/r/dailyprogrammer" target="_blank" flat>
      <span class="mr-2">Community</span>
    </v-btn>
    <v-treeview
      slot="navigationDrawerList"
      open-on-click
      transition
      :open.sync="open"
      :items="challenges"
      activatable
      :active.sync="active"
    ></v-treeview>
    <template slot="content">
      <v-dialog :value="!!corsError" width="500" persistent>
        <v-card>
          <v-card-title primary-title class="error">{{ corsError }}</v-card-title>
          <v-card-text>
            If you are using Firefox,
            you may need to disable content blocking for this site
            to be able to retrieve challenges from the subreddit
          </v-card-text>
        </v-card>
      </v-dialog>
      <v-layout v-if="selected" justify-center align-start row wrap>
        <v-flex md7 xs12>
          <v-card>
            <v-card-title>
              <h2 class="display-3">{{ selected.name }}</h2>
            </v-card-title>
            <v-card-text>
              <VueMarkdown :source="selected.description"></VueMarkdown>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex md5 xs12 style="position: -webkit-sticky; position: sticky; top: 5em;">
          <v-card flat>
            <v-card-title class="caption">
              <v-spacer></v-spacer>In-browser code editor by
              <a href="https://codemirror.net/">CodeMirror</a>
            </v-card-title>
            <v-card-text @keyup.ctrl.enter="runSkulpt">
              <codemirror v-model="selected.code" :options="cmOptions"></codemirror>
            </v-card-text>
            <v-card-actions class="caption">
              In-browser impemenation of Python by
              <a href="http://www.skulpt.org/">Skulpt</a>
              <v-spacer></v-spacer>
              <v-btn @click="runSkulpt">RUN</v-btn>or Ctrl+Enter
            </v-card-actions>
          </v-card>
          <v-card flat color="black">
            <v-card-text style="max-height: 300px; overflow-y: scroll;">
              <pre id="output">{{ selected.output }}</pre>
            </v-card-text>
            <div id="canvas"></div>
          </v-card>
        </v-flex>
      </v-layout>
      <v-bottom-sheet :value="!!errorMessage" persistent inset>
        <v-alert type="error" :value="true">
          <v-layout row align-center>
            <v-flex d-flex>{{errorMessage}}</v-flex>
            <v-spacer></v-spacer>
            <v-icon @click="errorMessage = ''" light>close</v-icon>
          </v-layout>
        </v-alert>
      </v-bottom-sheet>
    </template>
  </AppLayout>
</template>

<script>
import Skulpt from 'skulpt';
import VueMarkdown from 'vue-markdown';
// require CodeMirror component
import { codemirror } from 'vue-codemirror';
// require CodeMirror styles
import 'codemirror/lib/codemirror.css';
// require other CodeMirror resources
// language
import 'codemirror/mode/python/python';
// theme css
import 'codemirror/theme/cobalt.css';
// require active-line.js
import 'codemirror/addon/selection/active-line';

function decodeEntities(encodedString) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = encodedString;
  return textArea.value;
}

export default {
  name: 'QuotidianSchemer',
  components: {
    VueMarkdown,
    codemirror,
    AppLayout: () => import('@/components/AppLayout.vue'),
  },
  data: () => ({
    errorMessage: '',
    challenges: [
      {
        id: 1,
        name: 'Easy',
        children: [],
      },
      {
        id: 2,
        name: 'Intermediate',
        children: [],
      },
      {
        id: 3,
        name: 'Hard',
        children: [],
      },
    ],
    corsError: '',
    open: [],
    active: [],
    cmOptions: {
      autoCloseBrackets: true,
      // tabSize: 4,
      styleActiveLine: true,
      lineNumbers: true,
      // line: true,
      mode: 'text/x-python',
      theme: 'cobalt',
      // keyMap: "emacs",
    },
  }),
  computed: {
    selected() {
      if (!this.active.length) return undefined;
      const id = this.active[0];
      return this.challenges
        .find(lvl => lvl.children.find(chlng => chlng.id === id)) // find the level this challenge is from
        .children.find(chlng => chlng.id === id); // then find the challenge itself
    },
  },
  created() {
    const self = this;
    fetch('https://www.reddit.com/r/dailyprogrammer/new.json?limit=1000')
      .then(response => response.json())
      .then((result) => {
        const re = /(Easy|Intermediate|Hard)/gi;
        result.data.children.forEach((child) => {
          const challengeLevel = child.data.title.match(re);
          if (challengeLevel) {
            self.challenges
              .find(lvl => lvl.name === challengeLevel[0])
              .children.push({
                id: child.data.id,
                name: decodeEntities(
                  child.data.title
                    .substring(child.data.title.lastIndexOf(']') + 1)
                    .trim(),
                ),
                description: decodeEntities(child.data.selftext),
                code: '',
                output: '',
              });
          }
        });
      })
      .catch((err) => {
        self.corsError = err.toString();
      });
    Skulpt.pre = 'output';
    Skulpt.configure({
      output: (text) => {
        if (self.selected) {
          self.selected.output += text;
        }
      },
      read: (x) => {
        if (
          Skulpt.builtinFiles === undefined
          || Skulpt.builtinFiles.files[x] === undefined
        ) {
          throw `File not found: '${x}'`;
        }
        return Skulpt.builtinFiles.files[x];
      },
    });
    (Skulpt.TurtleGraphics || (Skulpt.TurtleGraphics = {})).target = 'canvas';
  },
  methods: {
    runSkulpt() {
      const self = this;
      if (self.selected) {
        self.selected.output = '';
        Skulpt.misceval
          .asyncToPromise(() => Skulpt.importMainWithBody(
            '<stdin>',
            false,
            self.selected.code,
            true,
          ))
          .then((mod) => {
            //
          })
          .catch((err) => {
            self.errorMessage = err.toString();
          });
      }
    },
  },
};
</script>
