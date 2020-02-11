<template>
  <div id="mobileMenu">
    <div>
      <div v-for="(box, key) in boxes.filter(b => b.name)" :key="key">
        <div>
          <button @click="$router.push(box.path)">{{ box.name }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['boxes'],
};
</script>

<style scoped>
@font-face {
  font-family: "Aclonica";
  font-display: swap;
  src: local("Aclonica"),
    url(https://fonts.gstatic.com/s/aclonica/v9/K2FyfZJVlfNNSEBXGY7UAo8.woff2)
      format("woff2");
}

@font-face {
  font-family: "Merienda";
  font-display: swap;
  src: local("Merienda"),
    url(https://fonts.gstatic.com/s/merienda/v7/gNMHW3x8Qoy5_mf8uWMFMIo.woff2)
      format("woff2");
}

#mobileMenu {
  width: 100%;
  height: 100%;
  background: #512da8;
  opacity: 0.9;
}

#mobileMenu > div {
  width: 50%;
  height: 100%;
  margin: 0 auto;
  border-radius: 25px;
  background: #03a9f4;
  opacity: 0.9;
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
  display: table;
}

#mobileMenu > div > div {
  display: table-row;
}

#mobileMenu > div > div > div {
  display: table-cell;
  vertical-align: middle;
}

#mobileMenu button {
  width: 100%;
  padding: 5px;
  border: 1px solid #673ab7;
  border-radius: 25px;
  background: #d1c4e9;
  opacity: 0.9;
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
  text-align: center;
  color: #212121;
  font-size: large;
  font-family: Aclonica, Merienda, "Lucida Sans Unicode", "Lucida Grande",
    sans-serif;
}
</style>
