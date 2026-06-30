Server.killAll;
s.boot;

(
s.waitForBoot({

    // =========================
    // UI
    // =========================
    var win, scopeView, controlView, waveMenu, statusText;
    var stethoscope, freqScope, envGraph;
    var b, pad;
    var leftControlPanel;
    var scopeContainer, freqContainer, envContainer;

    var adsrBox, filterBox;
    var adsrHeader, filterHeader;
    var octMinusButton, octPlusButton;
    var topRowControls, octaveGroup, waveGroup;

    var darkBg = Color.fromHexString("#121212");
    var cardBg = Color.fromHexString("#1E1E1E");
    var groupBg = Color.gray(0.18);
    var accentC = Color.fromHexString("#00E676");
    var textC = Color.white;
    var dimTextC = Color.gray(0.6);

    var attackLabel, decayLabel, sustainLabel, releaseLabel;
    var cutoffLabel, resLabel, octaveLabel, waveLabel;

    // =========================
    // STATE (NO “DEAD” VALUES)
    // =========================
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

    ~cutoffBus = Bus.control(s,1);
    ~resBus = Bus.control(s,1);

    s.sync;

    ~cutoffBus.set(~cutoff);
    ~resBus.set(~res);

    // =========================
    // SYNTH
    // =========================
    SynthDef(\voice, { |freq=440, gate=0, wave=0,
        attack=0.02, decay=0.15, sustain=0.7, release=0.2|

        var sig, env, cutoff, res;

        // FIXED: Added Lag.kr with a 0.1-second time constant to smooth out pot movements
        cutoff = Lag.kr(In.kr(~cutoffBus, 1), 0.1);
        res = Lag.kr(In.kr(~resBus, 1), 0.1);

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

        sig = RLPF.ar(sig, cutoff.clip(80,12000), res.clip(0.01,0.99));
        Out.ar(0, sig * env * 0.25 ! 2);
    }).add;

    s.sync;

    // =========================
    // NOTE SYSTEM (SAFE)
    // =========================
    ~noteOn = { |id|
        var freq;

        freq = (~baseMidi + id).midicps;

        if(~voices[id].notNil){
            ~voices[id].set(\gate,0);
            ~voices[id] = nil;
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
    };

    ~noteOff = { |id|
        if(~voices[id].notNil){
            ~voices[id].set(\gate,0);
            ~voices[id] = nil;
        };
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

    statusText = StaticText().string_("READY").stringColor_(textC).font_(Font(Font.defaultSansFace, 14, true)).fixedWidth_(90);

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
            ~updateGUI.value;
        };
    });

    octPlusButton.action_({
        if(~octaveIndex < 3) {
            ~octaveIndex = ~octaveIndex + 1;
            ~baseMidi = ~octaves[~octaveIndex];
            ~updateGUI.value;
        };
    });

    topRowControls.layout.add(statusText);
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
    // GUI UPDATE
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

    ~updateGUI.value;

    // =========================
    // SERIAL
    // =========================
    ~port = SerialPort.devices.detect({ |p|
        p.contains("usb") or: { p.contains("COM") }
    });

    if(~port.notNil){
        ~port = SerialPort(~port, 115200);
        statusText.string = "CONNECTED";
    }{
        statusText.string = "NO DEVICE";
    };

    ~buffer = "";

    Routine({
        var byte, msg, parts, type, id, val;

        loop {
            if(~port.notNil){
                while ({ byte = ~port.read; byte.notNil }, {
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

                                    ~updateGUI.value;
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

            0.005.wait;
        };
    }).play(AppClock);

    win.onClose = {
        freqScope.kill;
        stethoscope.free;
    };

});
)
