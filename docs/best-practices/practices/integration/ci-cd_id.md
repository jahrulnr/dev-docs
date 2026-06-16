# CI/CD (Continuous Integration / Continuous Delivery)

## Overview

**CI/CD** menggabungkan praktik dan otomatisasi yang mengintegrasikan perubahan kode secara sering, memverifikasi kualitas secara otomatis, dan mengirim atau *deploy* artefak yang siap rilis dengan langkah manual minimal. **Continuous Integration (CI)** menggabungkan pekerjaan ke jalur bersama secara rutin—setiap penggabungan memicu *build*, tes, dan analisis. **Continuous Delivery (CD)** menjaga *main branch* selalu dapat di-*deploy*; **Continuous Deployment** melangkah lebih jauh dengan mempromosikan *build* yang lulus ke produksi secara otomatis.

*Pipeline* modern adalah kode: YAML di GitHub Actions, GitLab CI, Jenkins, atau Tekton. Mereka mengenkode jalur dari *commit* ke perangkat lunak yang berjalan—kompilasi, unit test, SAST, *build image* kontainer, tes integrasi, *deploy staging*, *smoke test*, *rollout* produksi dengan persetujuan atau strategi progresif.

CI/CD mengurangi risiko integrasi, memperpendek *feedback loop*, dan membuat rilis dapat diulang. Tidak menggantikan tes yang baik, observability, atau desain *rollback*; *pipeline* cepat yang mengirim kode rusak justru berbahaya.

## Core concepts

- **Pipeline as code** — terverifikasi, dapat di-*review*, reproduksibel.
- **Artifact immutability** — *build* sekali, promosikan *image*/*binary* yang sama lintas lingkungan.
- **Fast feedback** — gagal lebih awal di unit test; paralelkan suite lambat.
- **Environment parity** — *staging* mencerminkan topologi produksi cukup untuk menangkap masalah nyata.
- **Secrets management** — kredensial di *vault*/*CI secret store*, tidak di repo.

## When to use

- Tim mana pun yang mengirim perangkat lunak ke lingkungan bersama (selalu, untuk pengiriman profesional).
- *Microservice*, *library*, dan repo infrastruktur yang diuntungkan verifikasi otomatis.
- Lingkungan regulasi yang butuh jejak audit siapa *deploy* apa dan kapan.

## When not to use

- Eksperimen benar-benar buang tanpa *deploy* ulang—tetap pertimbangkan CI minimal untuk tes.
- Jangan otomatisasi *deploy* ke produksi tanpa tes dan jalur *rollback* "karena CI/CD bilang begitu."

## Trade-offs

| Pipeline otomatis | Jeratan |
| --- | --- |
| Rilis lebih cepat dan aman | Biaya setup dan pemeliharaan awal |
| *Quality gate* konsisten | Tes *flaky* mengikis kepercayaan—perbaiki atau karantina |
| Dapat diaudit | *Pipeline* terlalu panjang menunda *feedback* |

## Example

Tahap tipikal:

```text
commit -> lint/unit test -> build image -> integration test
       -> push to registry -> deploy staging -> smoke test
       -> manual approval (delivery) or auto deploy (deployment) -> prod
```

Gunakan **feature flag** untuk memisahkan *deploy* dari rilis. Pasangkan *deploy* produksi dengan strategi [blue-green](../deployment/blue-green-deployment_id.md) atau [canary](../deployment/canary-deployment_id.md).

## Related

- [Blue-Green Deployment](../deployment/blue-green-deployment_id.md) — peralihan tanpa downtime
- [Canary Deployment](../deployment/canary-deployment_id.md) — pergeseran traffic bertahap
- [Fail Fast](../../principles/fail-fast_id.md) — gagalkan *pipeline* lebih awal pada input buruk

## References

- Martin Fowler — artikel Continuous Integration dan Continuous Delivery
- Metrik DORA — frekuensi *deploy*, *lead time*, tingkat kegagalan perubahan
