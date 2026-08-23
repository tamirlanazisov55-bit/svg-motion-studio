(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const shaderSelect = $('#shaderMode');
  const roleSelect = $('#shaderRole');
  const autoplaySelect = $('#autoplayMode');
  const effectLabel = $('#activeEffectLabel');
  const motionSummary = $('#motionSummary');

  const effectNames = {
    strands: 'Strands',
    galaxy: 'Galaxy',
    prismatic: 'Prismatic Burst',
    siderays: 'Side Rays',
    silk: 'Silk'
  };

  function dispatchChange(el) {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function syncEffectCards() {
    const active = shaderSelect.value;
    $$('.effect-card').forEach(card => card.classList.toggle('is-active', card.dataset.effect === active));
    syncStatus();
  }

  function syncRoleButtons() {
    $$('#shaderRoleSegmented .segment').forEach(btn => btn.classList.toggle('is-active', btn.dataset.role === roleSelect.value));
    syncStatus();
  }

  function syncAutoplayButtons() {
    $$('#autoplaySegmented .segment').forEach(btn => btn.classList.toggle('is-active', btn.dataset.autoplay === autoplaySelect.value));
  }

  function syncStatus() {
    const role = roleSelect.value === 'fill' ? 'lives inside shape' : 'reveal only';
    effectLabel.textContent = `${effectNames[shaderSelect.value] || shaderSelect.value} · ${role}`;
  }

  function syncMotionSummary() {
    const duration = Number($('#revealDuration').value || 0).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    const morph = Math.round(Number($('#morphStrength').value || 0) * 100);
    motionSummary.textContent = `${duration}s · morph ${morph}%`;
  }

  $$('.effect-card').forEach(card => {
    card.addEventListener('click', () => {
      shaderSelect.value = card.dataset.effect;
      dispatchChange(shaderSelect);
      syncEffectCards();
    });
  });

  $$('#shaderRoleSegmented .segment').forEach(btn => {
    btn.addEventListener('click', () => {
      roleSelect.value = btn.dataset.role;
      dispatchChange(roleSelect);
      syncRoleButtons();
    });
  });

  $$('#autoplaySegmented .segment').forEach(btn => {
    btn.addEventListener('click', () => {
      autoplaySelect.value = btn.dataset.autoplay;
      dispatchChange(autoplaySelect);
      syncAutoplayButtons();
    });
  });

  $('#previewReplayBtn')?.addEventListener('click', () => $('#replayBtn')?.click());

  ['revealDuration', 'morphStrength'].forEach(id => {
    $('#' + id)?.addEventListener('input', syncMotionSummary);
  });

  shaderSelect.addEventListener('change', syncEffectCards);
  roleSelect.addEventListener('change', syncRoleButtons);
  autoplaySelect.addEventListener('change', syncAutoplayButtons);

  $('#importFile')?.addEventListener('change', () => setTimeout(() => {
    syncEffectCards(); syncRoleButtons(); syncAutoplayButtons(); syncMotionSummary();
  }, 120));
  $('#applyDumpBtn')?.addEventListener('click', () => setTimeout(() => {
    syncEffectCards(); syncRoleButtons(); syncAutoplayButtons(); syncMotionSummary();
  }, 60));
  $('#presetPaletteBtn')?.addEventListener('click', () => setTimeout(syncEffectCards, 30));

  $('#glowEnabled')?.addEventListener('click', e => e.stopPropagation());

  syncEffectCards();
  syncRoleButtons();
  syncAutoplayButtons();
  syncMotionSummary();
})();
