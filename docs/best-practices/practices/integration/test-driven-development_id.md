# Test-Driven Development (TDD)

## Gambaran Umum

Test-Driven Development (TDD) adalah metodologi pengembangan perangkat lunak di mana pengujian ditulis sebelum kode implementasi. Siklus TDD terdiri dari Red-Green-Refactor: tulis test yang gagal (Red), buat kode minimal untuk pass (Green), lalu refactor untuk improve design tanpa mengubah behavior. Pendekatan ini memastikan kode selalu teruji, mengurangi bug, dan mendorong design yang modular.

TDD berbeda dengan testing tradisional yang dilakukan setelah development; di sini, test mendorong implementasi.

## Prinsip Utama

- **Red-Green-Refactor Cycle**: Siklus iteratif untuk development.
- **Test-First**: Test ditulis sebelum kode.
- **Incremental Development**: Kode dibangun step-by-step berdasarkan test.
- **Refactoring Aman**: Test sebagai safety net untuk perubahan.
- **High Coverage**: Target 100% domain logic coverage.

## Siklus Red-Green-Refactor

1. **Red**: Tulis test untuk fitur baru; test akan gagal karena kode belum ada.
2. **Green**: Implementasi kode minimal untuk membuat test pass.
3. **Refactor**: Improve kode (e.g., remove duplication) tanpa mengubah behavior; test tetap pass.

Contoh siklus sederhana dengan Jest (JavaScript):

```javascript
// Red: Tulis test
test('add should return sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
});

// Green: Implementasi minimal
function add(a, b) {
  return a + b;
}

// Refactor: Jika perlu, improve tanpa ganti behavior
```

## Kesesuaian dengan Metodologi Development

TDD sangat cocok untuk:

- **Agile/Scrum**: Mendukung iterative development dengan feedback cepat.
- **Clean Code Practices**: Mendorong SOLID principles dan decoupling.
- **Legacy Refactoring**: Aman untuk mengubah kode existing.
- **Team Collaboration**: Test sebagai spesifikasi yang jelas.

Kurang cocok untuk:
- Prototyping cepat tanpa struktur.
- Sistem dengan dependencies kompleks yang sulit di-mock.
- Tim tanpa pengalaman testing.

## Contoh Implementasi

### Contoh di Golang dengan Testing Framework
```go
// Red: Test untuk function kalkulasi
func TestCalculateTotal(t *testing.T) {
    result := CalculateTotal(100, 0.1) // 100 + 10% tax
    if result != 110 {
        t.Errorf("Expected 110, got %f", result)
    }
}

// Green: Implementasi
func CalculateTotal(price float64, taxRate float64) float64 {
    return price + (price * taxRate)
}

// Refactor: Tambah error handling
func CalculateTotal(price float64, taxRate float64) (float64, error) {
    if price < 0 {
        return 0, errors.New("price cannot be negative")
    }
    return price + (price * taxRate), nil
}
```

Update test untuk handle error.

### Contoh dengan Mocking
Gunakan library seperti gomock untuk dependencies.

## Kelebihan dan Kekurangan

### Kelebihan
- **Bug Reduction**: Test dini mencegah regresi.
- **Better Design**: Mendorong decoupling dan single responsibility.
- **Confidence in Refactor**: Test sebagai safety net.
- **Documentation**: Test sebagai spesifikasi hidup.
- **Faster Debugging**: Isolasi issue melalui test.

### Kekurangan
- **Learning Curve**: Membutuhkan mindset shift.
- **Slower Initial Development**: Test-writing time.
- **Maintenance Overhead**: Test perlu update saat refactor.
- **Not for UI/Integration**: Lebih cocok untuk unit tests.
- **Over-Testing**: Risiko test yang brittle.

## Best Practices

- **Start Small**: Mulai dengan test sederhana.
- **One Test at a Time**: Fokus satu requirement.
- **Mock Dependencies**: Gunakan stubs/mocks untuk isolasi.
- **Run Tests Often**: Automate dengan CI/CD.
- **Refactor Regularly**: Jaga kode clean tanpa break test.

## Common Pitfalls

- **Testing Implementation**: Test behavior, bukan detail internal.
- **Skipping Refactor**: Akumulasi technical debt.
- **Incomplete Coverage**: Fokus domain logic utama.
- **Slow Tests**: Hindari integration tests di TDD.
- **Resistance**: Tim perlu training untuk adopt.

## Referensi
- Buku "Test-Driven Development: By Example" oleh Kent Beck.
- Artikel Martin Fowler tentang TDD.
- Dokumentasi testing frameworks (Jest, JUnit, pytest).
- Tools: JUnit, pytest, Mockito untuk mocking.