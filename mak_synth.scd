Server.killAll;
s.boot;

(
s.waitForBoot({

    // =========================
    // UI VARIABLES
    // =========================
    var win, scopeView, controlView, waveMenu, statusText;
    var stethoscope, freqScope, envGraph;
    var b, pad;
    var leftControlPanel;
    var scopeContainer, freqContainer, envContainer;

    var adsrBox, filterBox;
    var adsrHeader, filterHeader;
    var octMinusButton, octPlusButton;
    var topRowControls, octaveGroup, waveGroup, osGroup, osMenu;

    var darkBg = Color.fromHexString("#121212");
    var cardBg = Color.fromHexString("#1E1E1E");
    var groupBg = Color.gray(0.18);
    var accentC = Color.fromHexString("#00E676");
    var textC = Color.white;
    var dimTextC = Color.gray(0.6);

    var attackLabel, decayLabel, sustainLabel, releaseLabel;
    var cutoffLabel, resLabel, octaveLabel, waveLabel, osLabel;

    // PERFORMANCE FLAG: Tracks if the GUI needs to be redrawn
    var guiDirty = true;

    // =========================
    // OS DETECTION & STATE
    // =========================
    ~detectedOS = thisProcess.platform.name; // \windows, \osx, or \linux
    ~osIndex = if(~detectedOS == \windows) { 0 } { 1 }; // 0: Windows, 1: macOS

    ~attack = 0.02;
    ~decay = 0.15;
    ~sustain = 0.7;
    ~release = 0.2;

    ~cutoff = 8000;
    ~res = 0.2;

    ~wave = 0;

    ~octaves = [36,48,60,72];
    ~octaveIndex = 1;
    ~baseMidi = ~octaves[~octaveIndex];

    ~voices = Array.fill(12, nil);
    ~buttonState = Array.fill(12, 0);

    // Track active voice count dynamically
    ~activeCount = 0;

    ~cutoffBus = Bus.control(s,1);
    ~resBus = Bus.control(s,1);
    ~countBus = Bus.control(s,1);

    s.sync;

    ~cutoffBus.set(~cutoff);
    ~resBus.set(~res);
    ~countBus.set(0);

    // =========================
    // SYNTH
    // =========================
    SynthDef(\voice, { |freq=440, gate=0, wave=0,
        attack=0.02, decay=0.15, sustain=0.7, release=0.2|

        var sig, env, cutoff, res, voiceCount, ampScaler;

        // Read real-time voice count from bus for volume management
        voiceCount = In.kr(~countBus, 1);

        cutoff = Lag3.kr(In.kr(~cutoffBus, 1), 0.15);
        res = In.kr(~resBus, 1); // Direct mapping without Lag3

        env = EnvGen.kr(
            Env.adsr(attack, decay, sustain, release),
            gate,
            doneAction:2
        );

        sig = Select.ar(wave, [
            SinOsc.ar(freq),
            Saw.ar(freq),
            Pulse.ar(freq,0.5),
            WhiteNoise.ar(0.05)
        ]);

        sig = RLPF.ar(sig, cutoff.clip(40, 15000), res.clip(0.01, 0.85));

        // POLYPHONIC HEADROOM COMPENSATION
        ampScaler = 0.25 / (voiceCount.max(1).sqrt);

        Out.ar(0, sig * env * ampScaler ! 2);
    }).add;

    s.sync;

    // =========================
    // NOTE SYSTEM (SAFE)
    // =========================
    ~noteOn = { |id|
        var freq = (~baseMidi + id).midicps;

        if(~voices[id].notNil){
            ~voices[id].set(\gate,0);
            ~voices[id] = nil;
            ~activeCount = (~activeCount - 1).max(0);
        };

        ~voices[id] = Synth(\voice, [
            \freq, freq,
            \wave, ~wave,
            \attack, ~attack,
            \decay, ~decay,
            \sustain, ~sustain,
            \release, ~release,
            \gate, 1
        ]);

        ~activeCount = ~activeCount + 1;
        ~countBus.set(~activeCount);
        guiDirty = true;
    };

    ~noteOff = { |id|
        if(~voices[id].notNil){
            ~voices[id].set(\gate,0);
            ~voices[id] = nil;
            ~activeCount = (~activeCount - 1).max(0);
            ~countBus.set(~activeCount);
            guiDirty = true;
        };
    };

    ~allNotesOff = {
        ~voices.do({ |voice, id|
            if(voice.notNil) {
                voice.set(\gate, 0);
                ~voices[id] = nil;
            }
        });
        ~activeCount = 0;
        ~countBus.set(0);
        guiDirty = true;
    };

    // =========================
    // GUI
    // =========================
    win = Window("MAK SYNTH", Window.screenBounds)
        .background_(darkBg)
        .front;

    b = win.bounds;
    pad = 15;

    scopeView = View(win)
        .background_(darkBg)
        .bounds_(Rect(pad, pad, b.width - (pad * 2), b.height * 0.50));

    scopeView.layout = HLayout();

    scopeContainer = View().background_(cardBg);
    scopeContainer.layout = VLayout(
        StaticText().string_("OSCILLOSCOPE").stringColor_(accentC).font_(Font(Font.defaultSansFace, 13, true)),
        StaticText().string_("Plots the physical vibration of the sound over time.").stringColor_(dimTextC).font_(Font(Font.defaultSansFace, 12, bold: true)),
        stethoscope = Stethoscope(s, 2, view: scopeContainer).view
    );
    scopeView.layout.add(scopeContainer);

    freqContainer = View().background_(cardBg);
    freqScope = FreqScopeView(freqContainer, freqContainer.bounds).active_(true).freqMode_(1);
    freqContainer.layout = VLayout(
        StaticText().string_("SPECTRAL ANALYZER").stringColor_(accentC).font_(Font(Font.defaultSansFace, 13, true)),
        StaticText().string_("Deconstructs the sound into its frequencies: Low (left) to High (right).").stringColor_(dimTextC).font_(Font(Font.defaultSansFace, 12, bold: true)),
        freqScope
    );
    scopeView.layout.add(freqContainer);

    controlView = View(win)
        .background_(cardBg)
        .bounds_(Rect(pad, b.height * 0.53, b.width - (pad * 2), b.height * 0.42));

    controlView.layout = HLayout();

    leftControlPanel = View().background_(cardBg);
    leftControlPanel.layout = VLayout().margins_(15).spacing_(15);

    topRowControls = View();
    topRowControls.layout = HLayout().margins_(0).spacing_(0);

    statusText = StaticText().string_("READY").stringColor_(textC).font_(Font(Font.defaultSansFace, 14, true)).fixedWidth_(100);

    osGroup = View();
    osGroup.layout = HLayout(
        osLabel = StaticText().string_("<b>OS:</b>").stringColor_(textC).font_(Font(Font.defaultSansFace, 14)),
        osMenu = PopUpMenu().items_(["Windows", "macOS"]).value_(~osIndex).minHeight_(35).fixedWidth_(90)
    ).margins_(0).spacing_(8);

    osMenu.action_({ |menu|
        ~osIndex = menu.value;
        ~reconnectSerial.value;
    });

    waveGroup = View();
    waveGroup.layout = HLayout(
        waveLabel = StaticText().string_("<b>Waveform:</b>").stringColor_(textC).font_(Font(Font.defaultSansFace, 14)),
        waveMenu = PopUpMenu().items_(["Sine","Saw","Pulse","Noise"]).minHeight_(35).fixedWidth_(110)
    ).margins_(0).spacing_(8);

    waveMenu.action_({ |menu|
        ~wave = menu.value;
    });

    octaveGroup = View();
    octaveGroup.layout = HLayout(
        octaveLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 14)),
        octMinusButton = Button().states_([["-", textC, groupBg]]).minWidth_(35).minHeight_(35),
        octPlusButton = Button().states_([["+", textC, groupBg]]).minWidth_(35).minHeight_(35)
    ).margins_(0).spacing_(8);

    octMinusButton.action_({
        if(~octaveIndex > 0) {
            ~octaveIndex = ~octaveIndex - 1;
            ~baseMidi = ~octaves[~octaveIndex];
            guiDirty = true;
        };
    });

    octPlusButton.action_({
        if(~octaveIndex < 3) {
            ~octaveIndex = ~octaveIndex + 1;
            ~baseMidi = ~octaves[~octaveIndex];
            guiDirty = true;
        };
    });

    topRowControls.layout.add(statusText);
    topRowControls.layout.add(nil, stretch: 1);
    topRowControls.layout.add(osGroup);
    topRowControls.layout.add(nil, stretch: 1);
    topRowControls.layout.add(waveGroup);
    topRowControls.layout.add(nil, stretch: 1);
    topRowControls.layout.add(octaveGroup);

    leftControlPanel.layout.add(topRowControls);

    adsrBox = View().background_(groupBg);
    adsrBox.layout = VLayout().margins_([18, 4, 18, 12]).spacing_(0);

    filterBox = View().background_(groupBg);
    filterBox.layout = VLayout().margins_([18, 4, 18, 12]).spacing_(0);

    adsrHeader = StaticText()
        .string_("ENVELOPE")
        .stringColor_(accentC)
        .font_(Font(Font.defaultSansFace, 15, bold: true));

    filterHeader = StaticText()
        .string_("FILTERS")
        .stringColor_(accentC)
        .font_(Font(Font.defaultSansFace, 15, bold: true));

    attackLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));
    decayLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));
    sustainLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));
    releaseLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));

    cutoffLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));
    resLabel = StaticText().stringColor_(textC).font_(Font(Font.defaultSansFace, 15));

    adsrBox.layout.add(adsrHeader); adsrBox.layout.add(nil, stretch: 1);
    adsrBox.layout.add(attackLabel); adsrBox.layout.add(nil, stretch: 1);
    adsrBox.layout.add(decayLabel); adsrBox.layout.add(nil, stretch: 1);
    adsrBox.layout.add(sustainLabel); adsrBox.layout.add(nil, stretch: 1);
    adsrBox.layout.add(releaseLabel);

    filterBox.layout.add(filterHeader); filterBox.layout.add(nil, stretch: 1);
    filterBox.layout.add(cutoffLabel); filterBox.layout.add(nil, stretch: 1);
    filterBox.layout.add(resLabel); filterBox.layout.add(nil, stretch: 1);
    filterBox.layout.add(StaticText()); filterBox.layout.add(nil, stretch: 1);
    filterBox.layout.add(StaticText());

    leftControlPanel.layout.add(
        View().layout_(HLayout(adsrBox, filterBox).margins_(0).spacing_(15)),
        stretch: 1
    );

    envContainer = View().background_(cardBg);
    envGraph = EnvelopeView()
        .background_(Color.gray(0.1))
        .drawLines_(true)
        .drawRects_(true)
        .strokeColor_(textC)
        .fillColor_(textC.alpha_(0.15))
        .selectionColor_(Color.white)
        .curves_(\lin)
        .editable_(false);

    envContainer.layout = VLayout(
        StaticText().string_("VOLUME ENVELOPE (ADSR)").stringColor_(accentC).font_(Font(Font.defaultSansFace, 13, true)),
        StaticText().string_("Maps the loudness lifecycle of a note from start to finish.").stringColor_(dimTextC).font_(Font(Font.defaultSansFace, 12, bold: true)),
        envGraph
    );

    controlView.layout.add(leftControlPanel, stretch: 1.4);
    controlView.layout.add(envContainer, stretch: 1);

    // =========================
    // DEBOUNCED GUI ENGINE
    // =========================
    ~updateGUI = {
        var totalTime, aX, dX, sX, rX, envData;
        var attStr, decStr, susStr, relStr, cutStr, resStr, octStr;

        attStr = "<b>Attack:</b> " ++ ~attack.round(0.001) ++ "s";
        decStr = "<b>Decay:</b> " ++ ~decay.round(0.001) ++ "s";
        susStr = "<b>Sustain:</b> " ++ ~sustain.round(0.001);
        relStr = "<b>Release:</b> " ++ ~release.round(0.001) ++ "s";

        cutStr = "<b>Cutoff:</b> " ++ ~cutoff.round(1) ++ " Hz";
        resStr = "<b>Resonance:</b> " ++ ~res.round(0.001);
        octStr = "<b>Octave:</b> " ++ (~octaveIndex + 1);

        totalTime = ~attack + ~decay + ~release + 0.5;
        aX = ~attack / totalTime;
        dX = (~attack + ~decay) / totalTime;
        sX = (~attack + ~decay + 0.5) / totalTime;
        rX = 1.0;

        envData = [
            [0.0, aX, dX, sX, rX],
            [0.0, 1.0, ~sustain, ~sustain, 0.0]
        ];

        {
            attackLabel.string = attStr;
            decayLabel.string = decStr;
            sustainLabel.string = susStr;
            releaseLabel.string = relStr;

            cutoffLabel.string = cutStr;
            resLabel.string = resStr;
            octaveLabel.string = octStr;

            envGraph.value = envData;
        }.defer;
    };

    Routine({
        loop {
            if(guiDirty) {
                ~updateGUI.value;
                guiDirty = false;
            };
            0.04.wait;
        }
    }).play(AppClock);

    // =========================
    // SERIAL (PLATFORM & AUTO-DETECT)
    // =========================
    ~findPort = {
        var devices = SerialPort.devices;
        var matched;

        if(~osIndex == 0) {
            matched = devices.detect({ |p|
                var path = p.asString.toLower;
                path.contains("com") && path.contains("bluetooth").not
            });
        };

        if(~osIndex == 1) {
            matched = devices.detect({ |p|
                var path = p.asString.toLower;
                path.contains("tty.usbmodem") ||
                path.contains("tty.usbserial") ||
                path.contains("cu.usb") ||
                path.contains("acm")
            });
        };

        matched;
    };

    ~reconnectSerial = {
        if(~port.notNil) {
            try { ~port.close };
            ~port = nil;
        };

        ~detectedPort = ~findPort.value;

        if(~detectedPort.notNil){
            try {
                ~port = SerialPort(~detectedPort, 115200);
                { statusText.string = "CONNECTED" }.defer;
                ("Connected (" ++ if(~osIndex == 0) {"Win"} {"Mac"} ++ ") at: " ++ ~detectedPort).postln;
            } {
                { statusText.string = "NO DEVICE" }.defer;
                ~port = nil;
            };
        }{
            { statusText.string = "NO DEVICE" }.defer;
            ("No compatible device found for OS mode: " ++ if(~osIndex == 0) {"Windows"} {"macOS"}).postln;
        };
    };

    ~reconnectSerial.value;

    ~buffer = "";

    Routine({
        var byte, msg, parts, type, id, val;

        loop {
            if(~port.notNil and: { ~detectedPort.notNil }) {
                var currentDevices = SerialPort.devices;
                var stillExists = currentDevices.includesEqual(~detectedPort);

                if(stillExists.not) {
                    "--- HARDWARE DISCONNECTED (USB PULLED) ---".postln;

                    ~allNotesOff.value;

                    try { ~port.close };
                    ~port = nil;
                    ~detectedPort = nil;

                    { statusText.string = "NO DEVICE" }.defer;
                };
            };

            if(~port.notNil and: { ~port.isOpen }) {
                while ({ byte = ~port.next; byte.notNil }, {
                    byte = byte.asAscii;

                    if(byte == $\n){
                        msg = ~buffer.asString;
                        ~buffer = "";

                        if(msg.beginsWith("<") and: { msg.endsWith(">") }) {
                            msg = msg.copyRange(1, msg.size - 2);
                            parts = msg.split($,);

                            if(parts.size == 3){
                                type = parts[0].asInteger;
                                id = parts[1].asInteger;
                                val = parts[2].asInteger;

                                if(type == 0){
                                    if(val == 0){
                                        ~noteOn.value(id);
                                    }{
                                        ~noteOff.value(id);
                                    };
                                };

                                if(type == 1){
                                    switch(id,
                                        0, { ~attack = val.linexp(0,1023,0.01,1.5) },
                                        1, { ~decay = val.linexp(0,1023,0.01,2.5) },
                                        2, { ~sustain = val.linlin(0,1023,0,1) },
                                        3, { ~release = val.linexp(0,1023,0.01,4.0) },
                                        4, { ~cutoff = val.linexp(0,1023,120,12000); ~cutoffBus.set(~cutoff) },
                                        5, { ~res = val.linexp(0,1023,0.01,0.99); ~resBus.set(~res) }
                                    );

                                    guiDirty = true;
                                };
                            };
                        };
                    }{
                        if(byte != $\r) {
                            ~buffer = ~buffer ++ byte;
                        };
                        if(~buffer.size > 200){ ~buffer = "" };
                    };
                });
            };

            0.02.wait;
        };
    }).play(AppClock);

    win.onClose = {
        freqScope.kill;
        stethoscope.free;
        if(~port.notNil) { ~port.close; };
    };

});
)


SynthDef.new(\synth, {



Server.killAll;
