const e="2017-06-24-step-0-part-1",t="step-0-part-1",o={title:"Step 0 – part 1",date:"2017-06-24",author:"jabez007",tags:["initial configuration","/etc","configuration","file system"],excerpt:`This will be the starting point for all of my projects, unless otherwise specified in that project. Instead of using the NOOBS installer, I like to use the [Raspbian Lite](https://www.raspberrypi.o...
`,featured:!1,draft:!1},n=4,i=`<h1>Step 0 – part 1</h1>
<p>This will be the starting point for all of my projects, unless otherwise specified in that project. Instead of using the NOOBS installer, I like to use the <a href="https://www.raspberrypi.org/downloads/raspbian/">Raspbian Lite</a> image for a couple of reasons. For one, most of my projects are using the Pi as a mini low-power server, so I don’t need nor want all the extra stuff that comes with a desktop environment. Second, and probably more importantly, I prefer the image over NOOBS because I can do some configuration before even booting up the Pi for the first time.</p>
<p>If you don’t know how to write the image file to your SD card, check out the instructions <a href="https://www.raspberrypi.org/documentation/installation/installing-images/">here</a>. For the most part, Windows and any Linux distribution I’ve used with a decent Desktop Environment will have a tool built in and will probably auto mount the SD card as soon as you plug it in.</p>
<p>Now, I suspect you are wondering about the configuration you can do before booting up the Pi. To do this, after you’ve created your SD card you can open it up in the File Explorer for you desktop (you might have two options with one called “boot”. Pick the other one for now).</p>
<p><img src="/img/blog/piyonline/raspian-lite-image-file.png" alt="Raspian Lite Image File"></p>
<p>You should see a list of folders with names like “dev”, “etc”, “home”, and “mnt”. We are going to focus on the “etc” folder.</p>
<p><img src="/img/blog/piyonline/filesystem.png" alt="filesystem"></p>
<p>That is where all the configuration files for everything that will be running on our Pi live. In just about every Linux disto “etc” is where all your configuration files and scripts will live, so when you’re searching for how to change the default behavior of something, that directory is probably a good starting point.</p>
<p>A quick, easy, and useful configuration change we can make is to change the hostname of our Pi. This is the name that your Pi would be know by on your network. The default that comes with Raspbian is “raspberrypi” (go figure).</p>
<p><img src="/img/blog/piyonline/hostname-edit.png" alt="hostname edit"></p>
<p>We can use the hostname to easily SSH into our Pi without having to know its specific IP address (especially useful if you do not have a static IP). The problem comes in if you have multiple Pis on your network, all with the same hostname. It’s like calling role in class and three student have the same name. You’ve probably already guessed it, but the fix here is to just change the default hostname by changing what is in the /etc/hostname file. You might need to run your Text Editor as an administrator then open the /etc/hostname file, change the hostname to whatever you like, and save the file.</p>
<p>If you want to put your Pi on your wireless network instead of plugging in an ethernet cable, we can also set that up before ever booting up your Pi. To do this we are going in to the “/etc/network” directory and open up the “interfaces” file.</p>
<p><img src="/img/blog/piyonline/interfaces.png" alt="interfaces"></p>
<p>Here we can see that the WPA configuration for both or our wireless interfaces (wlan0 being the on board wireless for the Pi and wlan1 being any wireless adapter you might plug in) are referencing another file. So if we go find and edit that file, we can set up the Pi for our wireless networks.</p>
<p><img src="/img/blog/piyonline/wpa_supplicant.png" alt="wpa_supplicant"></p>
<p>For a network with a password, you would enter something like the following:</p>
<pre><code>network={

  ssid=&quot;The_ESSID&quot;

  psk=&quot;The_wifi_password&quot;

  }
</code></pre>
<p>For a network without a password, you would enter something like the following:</p>
<pre><code>network={

  ssid=&quot;The_ESSID&quot;

  key_mgmt=NONE

  }
</code></pre>
<p>and you can enter multiple different networks into this file.</p>
<p>Whether you are going to use a wired or wireless network, if you want to be able to SSH into your Pi from the start, we need to make sure SSH is enabled. To do this, we are going to go into that boot partition of the Raspbian image and add an empty file called “ssh”
<img src="/img/blog/piyonline/boot.png" alt="boot"></p>
<p>With that, you should be ready to eject your SD card and boot up your Pi. Part two will cover a few things we should do on the initial boot of any project.</p>
`,a={id:e,slug:t,frontmatter:o,readingTime:n,content:i};export{i as content,a as default,o as frontmatter,e as id,n as readingTime,t as slug};
