(() => {
  window.WeddingInvitationConfig = {
    duration: 6200,
    colors: {
      burgundy: '#4B0E1A',
      darkRed: '#7A1E2D',
      ivory: '#FDF6ED',
      gold: '#D4AF37',
      warmBrown: '#8B5E3C'
    },
    timeline: {
      tap: 0.00,
      sealOpen: 0.10,
      flapOpen: 0.20,
      cardStart: 0.36,
      cardClear: 0.68,
      cardPresented: 0.84,
      transition: 0.94,
      complete: 1.00
    },
    layout: {
      mobile: { envelopeVW: 0.84, maxEnvelope: 430, cardRatio: 0.70 },
      tablet: { envelopeVW: 0.62, maxEnvelope: 560, cardRatio: 0.67 },
      desktop: { envelopeVW: 0.43, maxEnvelope: 590, cardRatio: 0.66 }
    },
    typography: {
      monogramY: 0.22,
      groomY: 0.40,
      ampY: 0.465,
      brideY: 0.53,
      ornamentY: 0.595,
      dateY: 0.665,
      scriptY: 0.80
    }
  };
})();