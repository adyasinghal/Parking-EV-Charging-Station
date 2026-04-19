package repository

import (
	"testing"
	"time"

	"voltpark/internal/models"
)

func TestChoosePricingRule_PrefersPeakWhenWindowMatches(t *testing.T) {
	rules := []models.PricingRule{
		{RuleID: 3, IsPeak: true, PeakStartTime: ptr("18:00:00"), PeakEndTime: ptr("22:00:00")},
		{RuleID: 2, IsPeak: false},
	}

	event := mustTime(t, "2026-04-19T19:30:00Z")
	selected := choosePricingRule(rules, event)
	if selected == nil {
		t.Fatal("expected a pricing rule")
	}
	if !selected.IsPeak {
		t.Fatalf("expected peak rule, got %+v", selected)
	}
}

func TestChoosePricingRule_FallsBackToOffPeak(t *testing.T) {
	rules := []models.PricingRule{
		{RuleID: 3, IsPeak: true, PeakStartTime: ptr("18:00:00"), PeakEndTime: ptr("22:00:00")},
		{RuleID: 2, IsPeak: false},
	}

	event := mustTime(t, "2026-04-19T10:00:00Z")
	selected := choosePricingRule(rules, event)
	if selected == nil {
		t.Fatal("expected a pricing rule")
	}
	if selected.IsPeak {
		t.Fatalf("expected off-peak rule, got %+v", selected)
	}
}

func TestMatchesPeakWindow_OvernightRange(t *testing.T) {
	rule := &models.PricingRule{
		IsPeak:        true,
		PeakStartTime: ptr("22:00:00"),
		PeakEndTime:   ptr("06:00:00"),
	}

	if !matchesPeakWindow(rule, mustTime(t, "2026-04-19T23:30:00Z")) {
		t.Fatal("expected 23:30 to match overnight peak window")
	}
	if !matchesPeakWindow(rule, mustTime(t, "2026-04-20T03:15:00Z")) {
		t.Fatal("expected 03:15 to match overnight peak window")
	}
	if matchesPeakWindow(rule, mustTime(t, "2026-04-20T12:00:00Z")) {
		t.Fatal("did not expect noon to match overnight peak window")
	}
}

func TestRound2(t *testing.T) {
	if got := round2(123.456); got != 123.46 {
		t.Fatalf("expected 123.46, got %.2f", got)
	}
}

func ptr[T any](v T) *T {
	return &v
}

func mustTime(t *testing.T, value string) time.Time {
	t.Helper()
	ts, err := time.Parse(time.RFC3339, value)
	if err != nil {
		t.Fatalf("parse time: %v", err)
	}
	return ts
}
