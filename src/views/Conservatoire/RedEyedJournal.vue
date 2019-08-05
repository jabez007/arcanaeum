<template>
    <v-card height="100%">
        <v-card-title>
            <h6 class="title">The Syndar Journal</h6>
        </v-card-title>
        <v-card-text style="height: 100%;">
            <p class="subheading">
                A journal discovered sometime in 263,
                believed to belong to the one know as "The Red-Eyed Syndar",
                detailing the initial observations of and eventual interaction with a tribe of Mordok
            </p>
            <v-card-text>
                <div class="flipbook-viewport">
                    <div class="container">
                        <div class="flipbook">
                    <div class="hard"> Turn.js </div>
	                <div class="hard"></div>
	                <div> Page 1 </div>
	                <div> Page 2 </div>
	                <div> Page 3 </div>
	                <div> Page 4 </div>
	                <div class="hard"></div>
	                <div class="hard"></div>
                </div>
                    </div>
                </div>
            </v-card-text>
        </v-card-text>
    </v-card>
</template>

<script>
import jQuery from 'jquery';
import turn from '@/assets/Conservatoire/turn';

turn(jQuery);

const $ = jQuery;

export default {
  name: 'SyndarJournals',
  mounted() {
    $('.flipbook').turn({
      width: 600,
      height: 300,
      elevation: 50,
      autoCenter: true,
    });
  },
};
</script>

<style scoped>
.flipbook-viewport{
	overflow: hidden;
	width: 100%;
	height: 100%;
}

.flipbook-viewport .container{
	position: absolute;
	top: 0%;
	left: 0%;
	margin: auto;
}

.flipbook-viewport .flipbook{
	width: 600px;
	height: 300px;
	left: 0px;
	top: 0px;
}

.flipbook-viewport .page{
	width: 200px;
	height: 300px;
    color: black;
	background-color:white;
	background-repeat:no-repeat;
	background-size:100% 100%;
}

.flipbook .hard {
    background: #ccc !important;
    color: #333;
    -webkit-box-shadow: inset 0 0 5px #666;
    -moz-box-shadow: inset 0 0 5px #666;
    -o-box-shadow: inset 0 0 5px #666;
    -ms-box-shadow: inset 0 0 5px #666;
    box-shadow: inset 0 0 5px #666;
    font-weight: bold;
}

.flipbook .page{
	-webkit-box-shadow:0 0 20px rgba(0,0,0,0.2);
	-moz-box-shadow:0 0 20px rgba(0,0,0,0.2);
	-ms-box-shadow:0 0 20px rgba(0,0,0,0.2);
	-o-box-shadow:0 0 20px rgba(0,0,0,0.2);
	box-shadow:0 0 20px rgba(0,0,0,0.2);
}

.flipbook-viewport .page img{
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-khtml-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	margin:0;
}

.flipbook-viewport .shadow{
	-webkit-transition: -webkit-box-shadow 0.5s;
	-moz-transition: -moz-box-shadow 0.5s;
	-o-transition: -webkit-box-shadow 0.5s;
	-ms-transition: -ms-box-shadow 0.5s;

	-webkit-box-shadow:0 0 20px #ccc;
	-moz-box-shadow:0 0 20px #ccc;
	-o-box-shadow:0 0 20px #ccc;
	-ms-box-shadow:0 0 20px #ccc;
	box-shadow:0 0 20px #ccc;
}
</style>

