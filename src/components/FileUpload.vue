<template>
  <div class="dropbox">
    <input
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="filesChange($event.target.files)"
      class="input-file"
    />
    <p v-if="!disabled">
      Drag your file(s) here to begin
      <br />or click to browse
    </p>
    <slot v-else>
      <p>Uploading {{ fileCount }} files...</p>
    </slot>
  </div>
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
  outline-offset: -10px;
  background: lightcyan;
  color: dimgray;
  padding: 10px 10px;
  min-height: 200px; /* minimum height */
  position: relative;
  cursor: pointer;
}

.input-file {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 200px;
  position: absolute;
  cursor: pointer;
}

.dropbox:hover {
  background: lightblue; /* when mouse over to the drop zone, change color */
}

.dropbox p {
  font-size: 1.2em;
  padding: 50px 0;
  text-align: center;
}

.dropbox div {
  display: flex;
  align-content: center;
}
</style>
