<template>
  <v-layout class="dropbox" row justify-center align-center>
    <input
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="filesChange($event.target.files)"
      class="input-file"
    />
    <v-fade-transition leave-absolute>
      <v-flex v-if="!disabled" shrink>
        <p>
          Drag your file(s) here to begin
          <br />or click to browse
        </p>
      </v-flex>
    </v-fade-transition>
    <slot>
      <v-fade-transition leave-absolute>
        <v-flex v-if="disabled" shrink>
          <p>Uploading {{ fileCount }} files...</p>
        </v-flex>
      </v-fade-transition>
    </slot>
  </v-layout>
</template>

<script>
export default {
  name: 'FileUpload',
  props: {
    accept: {
      type: String,
      default: '.*',
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    fileCount: 0,
  }),
  methods: {
    filesChange(fileList) {
      if (!fileList.length) return;

      this.fileCount = fileList.length;

      const reader = new FileReader();
      reader.onload = e => this.$emit('load', e.target.result);
      Array.from(Array(fileList.length).keys()).forEach((i) => {
        reader.readAsArrayBuffer(fileList[i]);
      });
    },
  },
};
</script>

<style scoped>
.dropbox {
  outline: 2px dashed grey; /* the dash box */
  outline-offset: -1rem;
  background: lightcyan;
  color: dimgray;
  padding: 1rem 1rem;
  min-height: 10rem; /* minimum height */
  position: relative;
  cursor: pointer;
}

.input-file {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 10rem;
  position: absolute;
  cursor: pointer;
}

.dropbox:hover {
  background: lightblue; /* when mouse over to the drop zone, change color */
}

.dropbox p {
  font-size: 1.2em;
  margin: auto 0;
  text-align: center;
}
</style>
