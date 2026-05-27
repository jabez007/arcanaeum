const e="2017-08-06-step-0-part-2",t="step-0-part-2",o={title:"Step 0 – Part 2",date:"2017-08-06",author:"jabez007",tags:["network"],excerpt:`Now that you've booted up your Raspberry Pi for the first time, changing the password for your pi user should really be the absolute first thing you do. If you want, you can disable the pi account ...
`,featured:!1,draft:!1},a=4,n=`<h1>Step 0 – Part 2</h1>
<p>Now that you’ve booted up your Raspberry Pi for the first time, changing the password for your pi user should really be the absolute first thing you do. If you want, you can disable the pi account later on, but not changing the password just leaves you vulnerable.</p>
<p>Changing your password is super simple. Assuming you are logged in as pi since this is our first time booting, you just have to type “passwd” at the bash prompt ($), enter your current (default) password, and then type in your new (secure) password twice.</p>
<p><img src="/img/blog/piyonline/passwd.png" alt="passwd"></p>
<p>You can check out the man (manual) page for passwd to see how to change the password for a user other than the one you are currently logged in as. But let’s be honest, who are you going to let touch your hard work? I’ll get more in to man pages in another post.</p>
<p><img src="/img/blog/piyonline/man.png" alt="man"></p>
<p><img src="/img/blog/piyonline/man-passwd.png" alt="man passwd"></p>
<p>You’ll also want to expand your file system. Chances are the SD card you wrote the Raspbian image to, is larger than the image was so you have a chunk of space on your SD card that you don’t even have access to. Expanding the file system allows Raspbian to utilize your entire SD card. Would you rather have a corner, or a whole room to yourself?</p>
<p>This is also made to be pretty easy for us to do. At the $ prompt type in “sudo raspi-config”. You should see this main menu screen.</p>
<p><img src="/img/blog/piyonline/raspi-config.png" alt="raspi-config"></p>
<p>You are going to use the arrow, tab, and enter keys to navigate this utility. Arrow down to highlight “7 Advanced Options” and press enter.</p>
<p><img src="/img/blog/piyonline/expand-filesystem.png" alt="Expand Filesystem"></p>
<p>And then with “A1 Expand Filesystem” highlighted, press enter. Your screen will probably flash back to the bash prompt for a quick second and then show this screen. (That’s just the utility running the command(s) necessary to expand your file system.)</p>
<p><img src="/img/blog/piyonline/expanded.png" alt="Expanded"></p>
<p>Once you see this screen you can press enter to go back to the main menu on the raspi-config utility. From there, you can press tab to highlight the “Finish” option and press enter. You’ll then be asked if you want to reboot your Pi.</p>
<p><img src="/img/blog/piyonline/reboot.png" alt="Reboot"></p>
<p>Go ahead and press enter to accept the default and reboot your Pi. If you select no here you’ll end up back at the $ prompt. From there you can restart your Pi with this command “sudo shutdown -r now”. The “-r” flag for the shutdown command will cause the Pi to restart. If you use the “-h” flag it will power off the Pi. The “now” option just tells the shutdown command to execute now. It would be possible to tell the shutdown command to restart or halt at some time in the future. Reading through the man(manual) page for the shutdown command will tell you everything you can do. Yes, we have to read the directions.</p>
<p><img src="/img/blog/piyonline/man-shutdown.png" alt="man shutdown"></p>
<p>Once your Pi is back up, the last bit for the initial setup is to make sure Raspbian and all its software is up-to-date. The Raspbian image available for download can be several months to years old, but some of the software included in it can see updates every couple of weeks or so. Not keeping up on the latest OS updates can also leave you open to security vulnerabilities.</p>
<p>This just requires two commands (less than the number of commands my wife gives me) and not much other input from you, as the user. This first run is “sudo apt-get update”. It may be a bit misleading, but this only updates the cache that the Raspbian package manager uses to keep track of what software is available and which version each of those software packages is on.</p>
<p><img src="/img/blog/piyonline/apt-get-update.png" alt="apt-get update"></p>
<p>Once that command has finished, the second command run is “sudo apt-get upgrade”. This is the command that will actually go through and compare the version of each piece of software installed on your Pi to the version of that software available through the package manager. It will tell you which packages have newer versions available and how much space those new versions will take up. It will then ask you if you want to download and install those newer versions. Why can’t life be this easy?</p>
<p><img src="/img/blog/piyonline/apt-get-upgrade.png" alt="apt-get upgrade"></p>
<p>Go ahead and type “Y” then press enter. Apt-get will take care of the rest and drop you at the $ prompt when it’s done.</p>
<p>That’s pretty much it. You should have the basics ready for most projects you’ll want to build on a Pi. Good luck igniting your creativity! Come back and see if my projects will spark some curiosity or ideas for your own!</p>
<p>Now, for me, it’s time to go grocery shopping for the week. Wife said.</p>
`,s={id:e,slug:t,frontmatter:o,readingTime:a,content:n};export{n as content,s as default,o as frontmatter,e as id,a as readingTime,t as slug};
