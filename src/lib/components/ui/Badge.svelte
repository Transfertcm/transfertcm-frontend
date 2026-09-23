<script lang="ts">
  import { t } from '$lib/stores/locale'
  let { statut } = $props<{ statut: string }>()

  const config: Record<string, { label: string; classe: string; icone: string }> = {
    // Commandes
    pending:              { label: 'status.pending',              classe: 'bg-slate-100 text-slate-600 border-slate-200',       icone: 'schedule' },
    pending_admin_review: { label: 'status.pending_admin_review', classe: 'bg-amber-100 text-amber-700 border-amber-200',       icone: 'rate_review' },
    admin_approved:       { label: 'status.admin_approved',       classe: 'bg-blue-100 text-blue-700 border-blue-200',          icone: 'verified' },
    assigned_to_cabin:    { label: 'status.assigned_to_cabin',    classe: 'bg-orange-100 text-orange-700 border-orange-200',    icone: 'assignment_ind' },
    awaiting_payment:     { label: 'status.awaiting_payment',     classe: 'bg-amber-100 text-amber-700 border-amber-200',       icone: 'payments' },
    in_progress:          { label: 'status.in_progress',          classe: 'bg-blue-100 text-blue-700 border-blue-200',          icone: 'autorenew' },
    completed:            { label: 'status.completed',            classe: 'bg-emerald-100 text-emerald-700 border-emerald-200', icone: 'check_circle' },
    cancelled:            { label: 'status.cancelled',            classe: 'bg-red-100 text-red-700 border-red-200',             icone: 'cancel' },
    rejected:             { label: 'status.rejected',             classe: 'bg-red-100 text-red-700 border-red-200',             icone: 'block' },
    returned_to_admin:    { label: 'status.returned_to_admin',    classe: 'bg-purple-100 text-purple-700 border-purple-200',    icone: 'undo' },
    payment_failed:       { label: 'status.payment_failed',       classe: 'bg-red-100 text-red-700 border-red-200',             icone: 'payment' },
    refunded:             { label: 'status.refunded',             classe: 'bg-teal-100 text-teal-700 border-teal-200',          icone: 'currency_exchange' },
    // Cabines
    active:               { label: 'status.active',               classe: 'bg-emerald-100 text-emerald-700 border-emerald-200', icone: 'check_circle' },
    suspended:            { label: 'status.suspended',            classe: 'bg-red-100 text-red-700 border-red-200',             icone: 'block' },
    paused:               { label: 'status.paused',               classe: 'bg-amber-100 text-amber-700 border-amber-200',       icone: 'pause_circle' },
    inactive:             { label: 'status.inactive',             classe: 'bg-slate-100 text-slate-600 border-slate-200',       icone: 'radio_button_unchecked' },
    // Abonnements
    expired:              { label: 'status.expired',              classe: 'bg-red-100 text-red-700 border-red-200',             icone: 'timer_off' },
  }

  const cfg = $derived(
    config[statut] ?? { label: statut, classe: 'bg-slate-100 text-slate-600 border-slate-200', icone: 'circle' }
  )
</script>

<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border badge-enter {cfg.classe}">
  <span class="material-symbols-outlined icon-filled" style="font-size: 12px;">{cfg.icone}</span>
  {$t(cfg.label)}
</span>
