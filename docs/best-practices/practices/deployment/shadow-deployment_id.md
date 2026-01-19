# Shadow Deployment

## Gambaran Umum

Shadow Deployment adalah strategi deployment di mana versi aplikasi baru dijalankan secara paralel dengan versi produksi, tapi traffic tidak di-route ke versi baru. Pendekatan ini memungkinkan testing versi baru dengan real traffic patterns tanpa risk user impact. Cocok untuk validating performance, load handling, atau behavior changes dalam environment identik production.

Berbeda dengan canary yang expose users, shadow hanya untuk internal testing.

## Prinsip Utama

- **Parallel Execution**: Jalankan shadow tanpa affect production traffic.
- **Traffic Mirroring**: Duplikasi requests ke shadow untuk testing.
- **No User Impact**: Users tidak terpengaruh oleh shadow.
- **Load Testing**: Validasi performance di real conditions.
- **Gradual Confidence**: Build confidence sebelum full rollout.

## Workflow Dasar

1. **Deploy Shadow**: Jalankan versi baru di environment paralel.
2. **Mirror Traffic**: Route copy requests ke shadow (headers, payloads).
3. **Monitor Outputs**: Bandingkan responses antara production dan shadow.
4. **Log Analysis**: Analyze performance, errors, tanpa affect users.
5. **Decide Rollout**: Jika shadow stable, proceed ke canary/blue-green.

Contoh workflow dengan service mesh seperti Istio:

```yaml
# Contoh Traffic Mirroring di Istio
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-vs
spec:
  http:
  - route:
    - destination:
        host: myapp
    mirror:
      host: shadow-app  # Mirror ke shadow
      port:
        number: 80
```

## Kesesuaian dengan Strategi Deployment

Shadow cocok untuk:

- **Performance Testing**: Validasi load handling di production-like conditions.
- **Risky Changes**: Testing major refactors tanpa user exposure.
- **Compliance Validation**: Ensure shadow meets requirements.
- **Microservices**: Mudah mirror traffic per service.

Kurang cocok untuk:
- UI/UX changes (karena no user interaction).
- Simple updates tanpa performance concerns.
- Environments tanpa traffic mirroring tools.

## Contoh Implementasi

### Contoh dengan AWS Lambda
Gunakan Lambda untuk shadow processing.

```javascript
// Mirror event ke shadow function
exports.handler = async (event) => {
  // Process production
  const prodResult = processProduction(event);

  // Mirror ke shadow (async, no block)
  mirrorToShadow(event);

  return prodResult;
};
```

### Contoh dengan Nginx
```nginx
# Mirror requests
location /api {
  proxy_pass http://production-app;

  # Mirror ke shadow
  mirror /mirror;
}

location /mirror {
  internal;
  proxy_pass http://shadow-app;
}
```

## Kelebihan dan Kekurangan

### Kelebihan
- **Zero Risk**: No user impact during testing.
- **Real Conditions**: Test dengan actual traffic patterns.
- **Performance Insights**: Detect bottlenecks pre-rollout.
- **Safe Validation**: Experiment tanpa consequences.
- **Data Collection**: Rich logs tanpa affect production.

### Kekurangan
- **Resource Intensive**: Jalankan duplicate infrastructure.
- **Complexity**: Membutuhkan mirroring setup.
- **No User Feedback**: Tidak dapat test UX langsung.
- **Cost Overhead**: Extra resources untuk shadow.
- **Limited Scope**: Hanya untuk backend/server-side testing.

## Best Practices

- **Selective Mirroring**: Mirror subset traffic untuk control load.
- **Comprehensive Logging**: Capture all inputs/outputs untuk analysis.
- **Performance Baselines**: Compare metrics dengan production.
- **Gradual Increase**: Start small, scale mirroring.
- **Cleanup**: Remove shadow setelah testing.

## Common Pitfalls

- **Overload Shadow**: Traffic mirror bikin shadow crash.
- **Incomplete Mirroring**: Headers/payloads tidak full duplicate.
- **Ignoring Differences**: Shadow environment berbeda dari prod.
- **No Rollback Plan**: Jika shadow reveal issues, plan next steps.
- **Cost Creep**: Lupa shutdown shadow instances.

## Referensi
- Dokumentasi Istio Traffic Mirroring.
- AWS Lambda for shadow processing.
- Buku "Site Reliability Engineering" oleh Google.
- Tools: Istio, Envoy, AWS X-Ray.