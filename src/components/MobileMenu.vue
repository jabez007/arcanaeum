<template>
  <div id="mobileMenu">
    <div>
      <div v-for="(box, key) in boxes.filter(b => b.name)" :key="key">
        <div>
          <button class="menuButton" @click="$router.push(box.path)">{{ box.name }}</button>
        </div>
      </div>
    </div>
    <button v-if="clientWidth > 960" id="openAether" :class="opened ? 'opened' : ''" @click="opened = !opened"></button>
    <desktop-menu v-if="clientWidth > 960" id="desktopMenu" :class="opened ? 'opened' : ''" :boxes="boxes" :isTouchDevice="true"></desktop-menu>
  </div>
</template>

<script>
export default {
  props: ['boxes'],
  components: {
    DesktopMenu: () => import('@/components/DesktopMenu.vue'),
  },
  data: () => ({
    opened: false,
    clientWidth: 0,
  }),
  mounted() {
    this.clientWidth = window.innerWidth; // > 960px for Large Tablets, Laptops, and Desktops
    const self = this;
    window.addEventListener('resize', () => {
      self.clientWidth = window.innerWidth;
    });
  },
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
  padding: 5px;
  border: 1px solid #673ab7;
}

#mobileMenu .menuButton {
  width: 100%;
  opacity: 0.9;
  background: #d1c4e9;
  border-radius: 25px;
  box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
  text-align: center;
  color: #212121;
  font-size: large;
  font-family: Aclonica, Merienda, "Lucida Sans Unicode", "Lucida Grande",
    sans-serif;
}

#mobileMenu > #openAether {
  background: rgba(209, 196, 233, 0.75);
  border-radius: 100%;
  height: 6.214rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 999;
  transition: transform 1s ease;
}

#mobileMenu > #openAether::before {
  display: inline-block;
  color: #673ab7;
  font-weight: 999;
  font-size: x-large;
  content: "\1F312\1F315\1F318";

}

#mobileMenu > #openAether.opened {
  transform: rotate(-90deg);
}

#mobileMenu > #desktopMenu {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100hv;
  z-index: 99;
  opacity: 0;
  transition: opacity 1s ease;
}

#mobileMenu > #desktopMenu.opened {
  opacity: 1;
}
</style>
