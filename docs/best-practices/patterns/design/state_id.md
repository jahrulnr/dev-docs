# State

## Overview

**State** memungkinkan objek mengubah perilakunya saat *internal state* berubah; objek seolah mengganti *class*-nya. Setiap *state* dienkapsulasi dalam tipe sendiri yang mengimplementasikan *interface* bersama, dan *context* mendelegasikan perilaku ke objek *state* saat ini alih-alih beralih pada *enum* atau *flag*.

*State machine* ada di mana-mana: koneksi TCP (CLOSED, ESTABLISHED, …), alur pesanan (*pending* → *paid* → *shipped*), pemutar media (*playing*, *paused*, *stopped*), dan mode UI (*edit* vs *view*). Tanpa pola ini, satu *class* menumpuk cabang `switch state` yang sulit diperluas dan diuji.

State berbeda dari **Strategy**: Strategy biasanya dikonfigurasi sekali dari luar untuk varian algoritma; transisi State sering internal dan terikat *domain event*. Keduanya mengganti logika kondisional dengan polimorfisme.

## How it works

1. Definisikan *interface* **State** dengan metode yang merepresentasikan perilaku *context* (`HandleRequest()`, `Next()`).
2. Implementasikan satu *class state* konkret per *state* yang diizinkan.
3. **Context** menyimpan referensi ke State saat ini dan meneruskan panggilan ke sana.
4. State dapat mentransisikan *context* dengan memanggil `context.SetState(newState)` saat aturan mengizinkan.

Transisi bisa berbasis tabel (*map* dari *event* + *state* → *next state*) untuk kejelasan pada mesin yang kompleks.

## When to use

- Perilaku bergantung pada *state* dan Anda punya banyak transisi atau *state*.
- Rantai `switch`/`if` pada kode status membesar setiap *state* baru.
- State berbagi sedikit kode dan layak mendapat tipe terpisah dengan pengujian fokus.

## When not to use

- Hanya dua atau tiga *state* sederhana dengan aturan stabil—*enum* kecil dan fungsi mungkin cukup.
- State hanya berbeda data, bukan perilaku—simpan *state* sebagai data, bukan tipe polimorfik.
- Alur kerja terdistribusi lintas *service*—modelkan dengan *workflow engine* eksplisit atau *event sourcing*, bukan graf State in-memory tunggal saja.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Melokalkan logika spesifik *state* | Lebih banyak tipe dan *wiring* |
| *Open/closed* untuk *state* baru | Matriks transisi bisa sulit divisualisasikan |
| Pengujian unit per *state* lebih mudah | Risiko transisi tidak valid jika tidak dijaga |

## Example

*Context* `Turnstile` mendelegasikan ke *state* `Locked` atau `Unlocked`. `Coin()` di `Locked` membuka kunci; `Push()` di `Unlocked` mengunci setelah satu orang masuk.

```go
type TurnstileState interface {
    Coin(t *Turnstile)
    Push(t *Turnstile)
}

type Locked struct{}
func (Locked) Coin(t *Turnstile) { t.setState(Unlocked{}) }

type Turnstile struct {
    state TurnstileState
}
func (t *Turnstile) Coin() { t.state.Coin(t) }
```

## Related

- [Strategy](../design/strategy_id.md) — algoritma yang dapat ditukar; State memodelkan *lifecycle*
- [Command](../design/command_id.md) — bisa memicu transisi *state* sebagai efek samping
- [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine) (landasan konseptual)

## References

- Gamma et al. — *Design Patterns*, bab State
- *State machine* eksplisit di telekomunikasi, protokol, dan *workflow engine*
