# GOOP_CYCLE_PVP_SYSTEM

**Status:** DRAFT / review-only — schema not applied (human gate)  
**Preview:** `/proof/goop-cycle`  
**Layer:** Den game shell on Connector / wonka facet

---

## Loop

1. **Pick a religion** — five faiths, five magic schools, rock-paper-scissors style advantages in duels.
2. **Life skills** — foraging, smithing, lore, rhetoric, beastkeeping, alchemy; XP from quests and duels buff fusion and combat.
3. **Quests** — Den-flavored tasks that award war points, skill XP, and fusion catalysts.
4. **Azure Dreams fusion** — pair two summons to birth a **unique** offspring (blended stats, inherited/mutant traits, generation counter, hashed name).
5. **Duels** — level summons, earn personal XP; winner banks **religion war points**.
6. **Biweekly Goop Cycle** — every 14 days all religions **reset to 0**; new goop theme + religion-specific prizes for the cycle winner.

---

## Religions & magics

| Religion | Magic | Favored stat | Strong vs | Weak vs |
|----------|-------|--------------|-----------|---------|
| Ember Covenant | Hearthbrand (forge) | might | root | tide |
| Tide Canticle | Salt Psalm (tide) | ward | forge | root |
| Copper Veil | Mirror Debt (veil) | wit | tide | spark |
| Root Compact | Loam Oath (root) | ward | veil | forge |
| Spark Choir | Coil Cant (spark) | flux | root | veil |

---

## Implementation map

| Piece | Location |
|-------|----------|
| Game rules | `lib/goop-cycle/*` |
| APIs | `app/api/goop-cycle/{fusion,duel,cycle}` |
| Preview UI | `components/goop-cycle/goop-cycle-scene.tsx` |
| Draft schema prep | `supabase/migrations/00003_goop_cycle_draft.sql` |

---

## Gates

- **SQL apply:** human gate (`foreman/HUMAN_GATES.md`)
- **Live PvP / prizes:** product + compliance review
- **Promotion from draft:** Operator creative approval

---

## Next build slices

- Real player-vs-player matchmaking (not sparring shades)
- Religion raid events (scheduled war windows)
- Goop prize inventory tied to billing cosmetics (no pay-to-win trust signals)
- Persist cycle standings server-side with cycle boundary cron
