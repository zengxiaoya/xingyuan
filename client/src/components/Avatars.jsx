/**
 * 星渊 SVG 头像库 — 6款手绘风格角色
 * 3款男孩 + 3款女孩，宇宙主题
 *
 * 使用方式:
 *   <AvatarDisplay id="boy1" size={40} />
 *   AVATAR_LIST  — 完整列表（含 id / label / component）
 */

/* ── 公共色 ── */
const SKIN    = '#F3C18A'
const SKIN_SH = '#e5a870'
const EYE_D   = '#1e1008'
const BLUSH   = '#f8a090'

/* ─────────────────────────────────────────────
   小工具：背景 + 星点
───────────────────────────────────────────── */
function BgGrad({ uid, c0, c1 }) {
  return (
    <defs>
      <radialGradient id={`avg_${uid}`} cx="44%" cy="36%" r="62%">
        <stop offset="0%"   stopColor={c0} />
        <stop offset="100%" stopColor={c1} />
      </radialGradient>
    </defs>
  )
}
function Bg({ uid }) {
  return <circle cx="40" cy="40" r="39" fill={`url(#avg_${uid})`} />
}
function Stars() {
  return (
    <>
      <circle cx="13" cy="17" r="1.1" fill="white" opacity=".55"/>
      <circle cx="67" cy="13" r=".9"  fill="white" opacity=".45"/>
      <circle cx="63" cy="64" r="1"   fill="white" opacity=".4"/>
      <circle cx="10" cy="57" r=".75" fill="white" opacity=".35"/>
    </>
  )
}

/* ── 通用脸部结构 ── */
function Face({ shirt = '#2a248a' }) {
  return (
    <>
      {/* 衣服 */}
      <path d={`M23 78 Q24 65 40 62 Q56 65 57 78`} fill={shirt} />
      {/* 脖子 */}
      <rect x="35.5" y="59" width="9" height="6.5" rx="3" fill={SKIN} />
      {/* 耳朵 */}
      <ellipse cx="22.5" cy="45" rx="3.2" ry="4.2" fill={SKIN} />
      <ellipse cx="57.5" cy="45" rx="3.2" ry="4.2" fill={SKIN} />
      <ellipse cx="22.5" cy="45" rx="1.6" ry="2.3" fill={SKIN_SH} opacity=".45" />
      <ellipse cx="57.5" cy="45" rx="1.6" ry="2.3" fill={SKIN_SH} opacity=".45" />
      {/* 脸 */}
      <ellipse cx="40" cy="46" rx="18.5" ry="20" fill={SKIN} />
    </>
  )
}

/* ── 通用眼睛 ── */
function Eyes({ lx = 33, rx_ = 47, y = 44, dreamy = false }) {
  const ry_ = dreamy ? 3.8 : 4.5
  return (
    <>
      <ellipse cx={lx} cy={y} rx="4.5" ry={ry_} fill="white" />
      <ellipse cx={rx_} cy={y} rx="4.5" ry={ry_} fill="white" />
      <circle  cx={lx + .5} cy={y + .5} r="3"   fill={EYE_D} />
      <circle  cx={rx_ + .5} cy={y + .5} r="3"   fill={EYE_D} />
      <circle  cx={lx + 1.6} cy={y - 1} r="1.15" fill="white" />
      <circle  cx={rx_ + 1.6} cy={y - 1} r="1.15" fill="white" />
    </>
  )
}

/* ── 通用腮红 ── */
function Blush() {
  return (
    <>
      <ellipse cx="27" cy="51" rx="4.2" ry="2.3" fill={BLUSH} opacity=".28" />
      <ellipse cx="53" cy="51" rx="4.2" ry="2.3" fill={BLUSH} opacity=".28" />
    </>
  )
}

/* ─────────────────────────────────────────────
   男孩 1 — 短发、认真、宇航员感
───────────────────────────────────────────── */
export function AvatarBoy1({ uid = 'b1', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#1d1a58" c1="#06041a" />
      <Bg uid={uid} />
      <Stars />
      <Face shirt="#24208a" />
      {/* 短发 — 深黑，侧分 */}
      <path d="M22.5 42 C22.5 26 30 18 40 18 C50 18 57.5 26 57.5 42 L57.5 35 C55 22 48 15 40 15 C32 15 25 22 22.5 35 Z" fill="#16112a" />
      {/* 发际线修饰 */}
      <path d="M22.5 35 C24 30 27 26 29 24" stroke="#16112a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* 眉毛 — 略皱，认真感 */}
      <path d="M29 39.5 Q33 38 37 39" stroke="#16112a" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M43 39 Q47 38 51 39.5" stroke="#16112a" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <Eyes />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 微抿，坚定 */}
      <path d="M36 54.5 Q40 57 44 54.5" stroke="#b06040" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <Blush />
      {/* 小星星装饰 */}
      <polygon points="67,22 68,25 71,25 68.5,27 69.5,30 67,28.2 64.5,30 65.5,27 63,25 66,25"
        fill="#EF9F27" opacity=".75" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   男孩 2 — 卷发、眼镜、好奇科学家
───────────────────────────────────────────── */
export function AvatarBoy2({ uid = 'b2', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#072222" c1="#010d0d" />
      <Bg uid={uid} />
      <Stars />
      <Face shirt="#184848" />
      {/* 卷发 — 棕色，蓬松 */}
      <path d="M22 42 C22 25 28 17 40 17 C52 17 58 25 58 42"
        fill="#5C3A1E" />
      {/* 卷发外轮廓凹凸 */}
      <path d="M22 42 C22 36 21 30 23 26 C22 28 21 34 22 42 Z" fill="#5C3A1E" />
      <ellipse cx="28" cy="20" rx="5" ry="5.5" fill="#5C3A1E" />
      <ellipse cx="36" cy="17" rx="5" ry="5.5" fill="#5C3A1E" />
      <ellipse cx="44" cy="17" rx="5" ry="5.5" fill="#5C3A1E" />
      <ellipse cx="52" cy="20" rx="5" ry="5.5" fill="#5C3A1E" />
      {/* 眉毛 */}
      <path d="M29 39.5 Q33 38.5 37 39.5" stroke="#3d2010" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M43 39.5 Q47 38.5 51 39.5" stroke="#3d2010" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Eyes y={44} />
      {/* 圆眼镜 */}
      <circle cx="33" cy="44" r="6.5" stroke="#7F77DD" strokeWidth="1.4" fill="rgba(127,119,221,0.06)" />
      <circle cx="47" cy="44" r="6.5" stroke="#7F77DD" strokeWidth="1.4" fill="rgba(127,119,221,0.06)" />
      <path d="M39.5 44 L40.5 44" stroke="#7F77DD" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M26.5 43 L24 42" stroke="#7F77DD" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M53.5 43 L56 42" stroke="#7F77DD" strokeWidth="1.4" strokeLinecap="round" />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 大笑 */}
      <path d="M34.5 54 Q40 58.5 45.5 54" stroke="#b06040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M35.5 54.5 Q40 57.5 44.5 54.5" fill="#c4795a" opacity=".3" />
      <Blush />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   男孩 3 — 竖发、自信、星际飞行员
───────────────────────────────────────────── */
export function AvatarBoy3({ uid = 'b3', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#100a28" c1="#040210" />
      <Bg uid={uid} />
      <Stars />
      {/* 额外星星 */}
      <circle cx="18" cy="50" r=".7" fill="white" opacity=".3"/>
      <circle cx="62" cy="22" r=".8" fill="white" opacity=".4"/>
      <Face shirt="#1a1060" />
      {/* 竖刺发 — 深蓝黑 */}
      <path d="M24 38 C24 26 32 18 40 18 C48 18 56 26 56 38" fill="#0d0d28" />
      {/* 发刺 */}
      <path d="M32 20 L29 10 L35 19 Z" fill="#0d0d28" />
      <path d="M37 18 L36 7  L41 17 Z" fill="#0d0d28" />
      <path d="M43 18 L44 7  L48 17 Z" fill="#0d0d28" />
      <path d="M48 20 L52 11 L53 21 Z" fill="#0d0d28" />
      {/* 眉毛 — 自信上扬 */}
      <path d="M29 39 Q33 37 37 38.5" stroke="#0d0d28" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M43 38.5 Q47 37 51 39" stroke="#0d0d28" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Eyes />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 自信宽笑 */}
      <path d="M34 53.5 Q40 58.5 46 53.5" stroke="#b06040" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <Blush />
      {/* 脸颊小星形 */}
      <polygon points="55,50 56,53 59,53 56.8,55 57.8,58 55,56.2 52.2,58 53.2,55 51,53 54,53"
        fill="#EF9F27" opacity=".7" transform="scale(0.55) translate(44, 38)" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   女孩 1 — 高马尾、活泼、宇宙队长
───────────────────────────────────────────── */
export function AvatarGirl1({ uid = 'g1', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#1e0840" c1="#080018" />
      <Bg uid={uid} />
      <Stars />
      <Face shirt="#381878" />
      {/* 头发底色 — 高马尾扎起 */}
      <path d="M22 42 C22 26 30 18 40 18 C50 18 58 26 58 42 L58 36 C56 22 49 16 40 16 C31 16 24 22 22 36 Z" fill="#1a1028" />
      {/* 马尾 — 从右侧顶部延伸 */}
      <path d="M52 20 C60 12 72 16 70 28 C68 36 60 34 55 28 C53 25 52 22 52 20 Z" fill="#1a1028" />
      {/* 发绳圈 */}
      <circle cx="53" cy="22" r="4" fill="#7F77DD" opacity=".85" />
      {/* 星星发夹 */}
      <polygon points="53,18 54.2,21.5 58,21.5 55.2,23.5 56.2,27 53,25 49.8,27 50.8,23.5 48,21.5 51.8,21.5"
        fill="#EF9F27" />
      {/* 眉毛 */}
      <path d="M29.5 39.5 Q33 38 37 39" stroke="#1a1028" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M43 39 Q47 38 50.5 39.5" stroke="#1a1028" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Eyes />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 开朗微笑 */}
      <path d="M35.5 54 Q40 57.5 44.5 54" stroke="#b06040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Blush />
      {/* 刘海 */}
      <path d="M26 30 C28 25 33 22 36 23 C31 24 27 27 26 30 Z" fill="#252040" opacity=".5" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   女孩 2 — 双马尾、眼镜、小科学家
───────────────────────────────────────────── */
export function AvatarGirl2({ uid = 'g2', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#200820" c1="#090008" />
      <Bg uid={uid} />
      <Stars />
      <Face shirt="#5a1860" />
      {/* 头发主体 */}
      <path d="M22 42 C22 26 30 18 40 18 C50 18 58 26 58 42 L58 36 C56 22 49 16 40 16 C31 16 24 22 22 36 Z" fill="#7d4a28" />
      {/* 左辫子 */}
      <path d="M24 36 C18 40 16 52 20 60 C22 64 26 64 28 60 C26 52 24 44 26 38 Z" fill="#7d4a28" />
      {/* 左发绳 */}
      <ellipse cx="24" cy="38" rx="4" ry="2.5" fill="#ff8fbe" />
      {/* 右辫子 */}
      <path d="M56 36 C62 40 64 52 60 60 C58 64 54 64 52 60 C54 52 56 44 54 38 Z" fill="#7d4a28" />
      {/* 右发绳 */}
      <ellipse cx="56" cy="38" rx="4" ry="2.5" fill="#ff8fbe" />
      {/* 眉毛 */}
      <path d="M29.5 39.5 Q33 38.5 37 39.5" stroke="#4a2810" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M43 39.5 Q47 38.5 50.5 39.5" stroke="#4a2810" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Eyes y={44} />
      {/* 眼镜 */}
      <rect x="27.5" y="39.5" width="11" height="10" rx="5" stroke="#EF9F27" strokeWidth="1.4" fill="rgba(239,159,39,0.06)" />
      <rect x="41.5" y="39.5" width="11" height="10" rx="5" stroke="#EF9F27" strokeWidth="1.4" fill="rgba(239,159,39,0.06)" />
      <path d="M38.5 44.5 L41.5 44.5" stroke="#EF9F27" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M27.5 43.5 L25 42.5" stroke="#EF9F27" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M52.5 43.5 L55 42.5" stroke="#EF9F27" strokeWidth="1.4" strokeLinecap="round" />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 大笑 */}
      <path d="M34.5 54.5 Q40 59 45.5 54.5" stroke="#b06040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Blush />
      {/* 雀斑 */}
      <circle cx="29" cy="51" r=".9" fill={SKIN_SH} opacity=".55" />
      <circle cx="31" cy="53" r=".9" fill={SKIN_SH} opacity=".55" />
      <circle cx="27.5" cy="53" r=".9" fill={SKIN_SH} opacity=".55" />
      <circle cx="51" cy="51" r=".9" fill={SKIN_SH} opacity=".55" />
      <circle cx="49" cy="53" r=".9" fill={SKIN_SH} opacity=".55" />
      <circle cx="52.5" cy="53" r=".9" fill={SKIN_SH} opacity=".55" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   女孩 3 — 长直发、梦幻、星空少女
───────────────────────────────────────────── */
export function AvatarGirl3({ uid = 'g3', size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <BgGrad uid={uid} c0="#080830" c1="#02020e" />
      <Bg uid={uid} />
      <Stars />
      {/* 多一颗星 */}
      <circle cx="20" cy="28" r=".8" fill="white" opacity=".5" />
      <circle cx="60" cy="36" r=".7" fill="white" opacity=".4" />
      <Face shirt="#1e1860" />
      {/* 长发 — 深紫黑，两侧垂落 */}
      <path d="M22 42 C22 26 30 18 40 18 C50 18 58 26 58 42 L58 36 C56 22 49 16 40 16 C31 16 24 22 22 36 Z" fill="#1e1040" />
      {/* 左侧垂发 */}
      <path d="M23 34 C19 42 18 55 22 66 C24 70 27 68 27 64 C24 55 22 44 24 36 Z" fill="#1e1040" />
      {/* 右侧垂发 */}
      <path d="M57 34 C61 42 62 55 58 66 C56 70 53 68 53 64 C56 55 58 44 56 36 Z" fill="#1e1040" />
      {/* 月牙发夹 */}
      <path d="M52 20 C54 18 58 18 58 22 C56 20 54 20 52 20 Z" fill="#AFA9EC" opacity=".9" />
      <path d="M52 20 C50 22 50 26 54 26 C52 24 51 22 52 20 Z" fill="#AFA9EC" opacity=".9" />
      {/* 刘海 */}
      <path d="M27 27 C30 22 35 20 38 21 C34 22 29 24 27 27 Z" fill="#2a1a50" opacity=".6" />
      {/* 眉毛 — 细柔 */}
      <path d="M29.5 39.5 Q33 38.8 37 39.5" stroke="#1e1040" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M43 39.5 Q47 38.8 50.5 39.5" stroke="#1e1040" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* 梦幻眼睛 — 略长型 */}
      <Eyes y={44} dreamy />
      {/* 下眼睫毛 */}
      <path d="M29 47 L28 48.5" stroke={EYE_D} strokeWidth=".9" strokeLinecap="round" />
      <path d="M31 47.5 L30.5 49" stroke={EYE_D} strokeWidth=".9" strokeLinecap="round" />
      <path d="M45 47 L44 48.5" stroke={EYE_D} strokeWidth=".9" strokeLinecap="round" />
      <path d="M47 47.5 L46.5 49" stroke={EYE_D} strokeWidth=".9" strokeLinecap="round" />
      {/* 鼻子 */}
      <path d="M38.5 49.5 Q40 51.5 41.5 49.5" stroke={SKIN_SH} strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* 嘴 — 梦幻淡笑 */}
      <path d="M36.5 54 Q40 56.5 43.5 54" stroke="#b06040" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Blush />
      {/* 小星光点缀 */}
      <circle cx="16" cy="32" r="1.2" fill="#AFA9EC" opacity=".6" />
      <path d="M64 48 L65 46 L66 48 L64 49 Z" fill="#AFA9EC" opacity=".55" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   统一入口
───────────────────────────────────────────── */
export const AVATAR_LIST = [
  { id: 'boy1',  label: '短发男孩',  component: AvatarBoy1  },
  { id: 'boy2',  label: '卷发科学家', component: AvatarBoy2  },
  { id: 'boy3',  label: '竖刺男孩',  component: AvatarBoy3  },
  { id: 'girl1', label: '马尾队长',  component: AvatarGirl1 },
  { id: 'girl2', label: '双辫科学家', component: AvatarGirl2 },
  { id: 'girl3', label: '星空少女',  component: AvatarGirl3 },
]

/** 根据 ID 渲染头像，兼容旧 emoji 字符串（直接显示文字） */
export function AvatarDisplay({ id, size = 40 }) {
  const item = AVATAR_LIST.find(a => a.id === id)
  if (!item) {
    // 旧 emoji 兜底
    return (
      <span style={{ fontSize: size * 0.5, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
        {id}
      </span>
    )
  }
  const Comp = item.component
  // uid 加上 size 避免同页多个同 id 头像的 gradient ID 冲突
  return <Comp uid={`${id}_${size}`} size={size} />
}
