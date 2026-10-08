(() => {
  window.WeddingInvitationConfig = Object.freeze({
    duration: 6200,
    holdMs: 800,

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
      sealOpen: 0.10,
      cordLoose: 0.16,
      flapOpen: 0.20,
      flapOpenDone: 0.38,
      cardStart: 0.36,
      cardClear: 0.68,
      cardPresented: 0.84,
      transition: 0.94,
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

      floralLeft: Object.freeze({ x: -28, y: 58, w: 118, h: 158 }),
      floralRight: Object.freeze({ x: 155, y: 105, w: 88, h: 118 }),

      envelope: Object.freeze({
        x: 10,
        w: 200,
        h: 122,
        closedY: 164,
        openY: 184,
        cardY: 190,
        presentedY: 222
      }),

      lining: Object.freeze({
        x: 10,
        y03: 106,
        y04: 111,
        w: 200,
        h: 84
      }),

      seal: Object.freeze({
        x: 92,
        y: 214,
        w: 36,
        h: 36
      }),

      card04: Object.freeze({ x: 58, y: 135, w: 106, h: 146 }),
      card05: Object.freeze({ x: 57, y: 74, w: 108, h: 149 }),
      card06: Object.freeze({ x: 60, y: 70, w: 102, h: 140 })
    }),

    typography: Object.freeze({
      // Balanced vertical rhythm for the visible card face.
      // Keep the title clear of the upper-left floral artwork.
      monogramY: 0.19,
      subtitleY: 0.265,
      ornamentTopY: 0.325,
      groomY: 0.435,
      ampY: 0.505,
      brideY: 0.575,
      ornamentBottomY: 0.655,
      dateY: 0.735
    })
  });
})();
