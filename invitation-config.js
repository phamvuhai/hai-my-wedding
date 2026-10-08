(() => {
  window.WeddingInvitationConfig = Object.freeze({
    duration: 5600,
    holdMs: 950,

    colors: Object.freeze({
      background: '#100205',
      burgundy: '#4B0E1A',
      darkRed: '#7A1E2D',
      ivory: '#FDF6ED',
      gold: '#D4AF37',
      warmBrown: '#8B5E3C'
    }),

    timeline: Object.freeze({
      tap: 0.00,
      sealOpen: 0.08,
      cordLoose: 0.12,
      flapOpen: 0.16,
      flapOpenDone: 0.36,
      cardStart: 0.31,
      cardClear: 0.66,
      cardPresented: 0.84,
      transition: 0.955,
      complete: 1.00
    }),

    keyframes: Object.freeze({
      '01': 0.00,
      '02': 0.14,
      '03': 0.31,
      '04': 0.53,
      '05': 0.86,
      '06': 0.965
    }),

    /*
      Figma Storyboard source coordinate system.
      These numbers mirror the editable storyboard frames exactly:
      220 x 320 design space, envelope/card/floral positions below.
    */
    designSpace: Object.freeze({
      width: 220,
      height: 320,
      fitWidth: 0.94,
      fitHeight: 0.82,
      desktopFitHeight: 0.78,
      mobileFitHeight: 0.78,
      floorY: 245,

      floralLeft: Object.freeze({ x: 15, y: 89, w: 48, h: 96 }),
      floralRight: Object.freeze({ x: 172, y: 116, w: 38, h: 78 }),

      envelope: Object.freeze({
        x: 15,
        w: 190,
        h: 116,
        closedY: 156,
        openY: 171,
        cardY: 179,
        presentedY: 210
      }),

      lining: Object.freeze({
        x: 15,
        y03: 111,
        y04: 115,
        w: 190,
        h: 80
      }),

      seal: Object.freeze({
        x: 95,
        y: 204,
        w: 30,
        h: 30
      }),

      card04: Object.freeze({ x: 61, y: 127, w: 98, h: 142 }),
      card05: Object.freeze({ x: 58, y: 62, w: 104, h: 151 }),
      card06: Object.freeze({ x: 59, y: 59, w: 102, h: 148 })
    }),

    typography: Object.freeze({
      monogramY: 0.145,
      subtitleY: 0.218,
      ornamentTopY: 0.275,
      groomScriptY: 0.365,
      groomY: 0.438,
      ampY: 0.505,
      brideScriptY: 0.585,
      brideY: 0.658,
      ornamentBottomY: 0.723,
      dateY: 0.785,
      footerY: 0.855
    })
  });
})();
