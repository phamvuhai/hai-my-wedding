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

    layout: Object.freeze({
      mobile: Object.freeze({
        envelopeVW: 0.90,
        maxEnvelope: 450,
        cardRatio: 0.72,
        anchorY: 0.515,
        floralScale: 1.00
      }),
      tablet: Object.freeze({
        envelopeVW: 0.64,
        maxEnvelope: 575,
        cardRatio: 0.69,
        anchorY: 0.505,
        floralScale: 1.05
      }),
      desktop: Object.freeze({
        envelopeVW: 0.45,
        maxEnvelope: 610,
        cardRatio: 0.68,
        anchorY: 0.505,
        floralScale: 1.08
      })
    }),

    card: Object.freeze({
      aspect: 1.375,
      startScale: 0.955,
      finalScale: 1.00,
      startRotation: -0.004,
      finalRotation: 0,
      riseEnvelopeRatio: 0.61,
      topMobile: 0.10,
      topDesktop: 0.09
    }),

    typography: Object.freeze({
      monogramY: 0.22,
      groomY: 0.40,
      ampY: 0.465,
      brideY: 0.53,
      ornamentY: 0.595,
      dateY: 0.665,
      scriptY: 0.80
    })
  });
})();
