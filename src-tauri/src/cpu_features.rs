// CPU feature detection and runtime microarchitecture dispatch
// Accurately inspects x86_64 vector extensions for maximum inference performance.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct CpuCapabilities {
    pub has_avx512_vnni: bool,
    pub has_avx512_f: bool,
    pub has_avx2: bool,
    pub has_fma: bool,
    pub has_avx: bool,
    pub has_sse42: bool,
    pub recommended_threads: usize,
    pub tier: &'static str,
}

impl CpuCapabilities {
    /// Detects CPU instruction set extensions at runtime.
    pub fn detect() -> Self {
        #[cfg(target_arch = "x86_64")]
        {
            let has_avx512_vnni = is_x86_feature_detected!("avx512vnni");
            let has_avx512_f = is_x86_feature_detected!("avx512f");
            let has_avx2 = is_x86_feature_detected!("avx2");
            let has_fma = is_x86_feature_detected!("fma");
            let has_avx = is_x86_feature_detected!("avx");
            let has_sse42 = is_x86_feature_detected!("sse4.2");

            // Tier evaluation:
            // 1. "avx512-vnni": Maximum acceleration (Intel Tiger Lake 11th Gen+, Ice Lake Xeon)
            // 2. "avx2-fma": High acceleration (Intel Haswell+, AMD Zen 1+)
            // 3. "avx": Moderate floating point acceleration (Intel Sandy Bridge+)
            // 4. "baseline": Fallback SSE
            let tier = if has_avx512_vnni && has_avx512_f {
                "avx512-vnni"
            } else if has_avx2 && has_fma {
                "avx2-fma"
            } else if has_avx {
                "avx"
            } else {
                "baseline"
            };

            let logical_cores = std::thread::available_parallelism()
                .map(|p| p.get())
                .unwrap_or(4);

            // Optimal neural compute threads:
            // Dedicate up to 4 threads for sub-model inference to prevent CPU starvation and thread thrashing
            let recommended_threads = (logical_cores / 2).clamp(1, 4);

            Self {
                has_avx512_vnni,
                has_avx512_f,
                has_avx2,
                has_fma,
                has_avx,
                has_sse42,
                recommended_threads,
                tier,
            }
        }
        #[cfg(not(target_arch = "x86_64"))]
        {
            let logical_cores = std::thread::available_parallelism()
                .map(|p| p.get())
                .unwrap_or(4);
            Self {
                has_avx512_vnni: false,
                has_avx512_f: false,
                has_avx2: false,
                has_fma: false,
                has_avx: false,
                has_sse42: false,
                recommended_threads: (logical_cores / 2).clamp(1, 4),
                tier: "generic",
            }
        }
    }
}
