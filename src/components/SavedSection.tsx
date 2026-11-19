"use client";

import type React from "react";
import { Bookmark, FileText, Code2, Newspaper } from "lucide-react";
import {
  type PaperData,
  type RepositoryData,
  type NewsArticleData,
} from "../types";

export interface SavedSectionProps {
  savedPapers: PaperData[];
  savedRepos: RepositoryData[];
  savedNews: NewsArticleData[];
  onRemovePaper: (paper: PaperData, e?: React.MouseEvent) => void;
  onRemoveRepo: (repo: RepositoryData, e?: React.MouseEvent) => void;
  onRemoveNews: (article: NewsArticleData, e?: React.MouseEvent) => void;
  onOpenPaper: (paper: PaperData) => void;
  onOpenRepo: (repo: RepositoryData) => void;
  onOpenNews: (article: NewsArticleData) => void;
}

export function SavedSection({
  savedPapers,
  savedRepos,
  savedNews,
  onRemovePaper,
  onRemoveRepo,
  onRemoveNews,
  onOpenPaper,
  onOpenRepo,
  onOpenNews,
}: SavedSectionProps) {
  const totalSavedCount =
    savedPapers.length + savedRepos.length + savedNews.length;

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-rule space-y-1.5">
        <h2 className="font-editorial-display text-2xl sm:text-3xl text-ink max-w-none">
          คลังบทความและโปรเจกต์ที่คุณคั่นหน้าไว้ ({totalSavedCount})
        </h2>
        <p className="text-sm font-editorial-body text-muted">
          รายการที่คั่นหน้าไว้จะถูกบันทึกอยู่ในเบราว์เซอร์ของคุณอย่างถาวร
          สามารถกลับมาอ่านซ้ำหรือคัดลอกโพสต์แชร์ได้ทุกเมื่อ
        </p>
      </div>

      {totalSavedCount === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-paper-2 rounded-[var(--radius-card)] space-y-3">
          <Bookmark className="w-7 h-7 text-accent-hi mx-auto" />
          <div className="font-editorial-display text-xl text-ink">
            ยังไม่มีบทความที่คั่นหน้าไว้
          </div>
          <p className="text-sm font-editorial-body text-muted max-w-xl mx-auto">
            กดปุ่ม &ldquo;คั่นหน้า&rdquo; บนเปเปอร์วิจัย โปรเจกต์โอเพนซอร์ส
            หรือข่าวสาร AI Lab ที่คุณสนใจเพื่อเก็บไว้อ่านภายหลัง
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {savedPapers.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-editorial-display text-lg sm:text-xl text-ink flex items-center gap-2 border-b border-rule pb-2.5 max-w-none">
                <FileText className="w-4 h-4 text-accent-hi shrink-0" />
                <span>เปเปอร์วิจัยที่คั่นไว้ ({savedPapers.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedPapers.map((paper) => (
                  <article
                    key={paper.id}
                    onClick={() => onOpenPaper(paper)}
                    className="repo-card group cursor-pointer p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent-2 transition-colors leading-snug">
                          {paper.hook_headline}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => onRemovePaper(paper, e)}
                          className="relative z-10 text-xs font-editorial-label text-muted hover:text-accent-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          ลบออก
                        </button>
                      </div>
                      <p className="text-sm font-editorial-body text-ink-2/90 line-clamp-2">
                        {paper.short_teaser}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-rule text-xs font-editorial-label text-accent-2 font-medium">
                      {paper.category}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {savedRepos.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-editorial-display text-lg sm:text-xl text-ink flex items-center gap-2 border-b border-rule pb-2.5 max-w-none">
                <Code2 className="w-4 h-4 text-accent-hi shrink-0" />
                <span>โปรเจกต์ GitHub ที่คั่นไว้ ({savedRepos.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedRepos.map((repo) => (
                  <article
                    key={repo.id}
                    onClick={() => onOpenRepo(repo)}
                    className="repo-card group cursor-pointer p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent-2 transition-colors leading-snug">
                          {repo.one_liner}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => onRemoveRepo(repo, e)}
                          className="relative z-10 text-xs font-editorial-label text-muted hover:text-accent-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          ลบออก
                        </button>
                      </div>
                      <p className="text-sm font-editorial-body text-ink-2/90 line-clamp-2">
                        {repo.problem_solved}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-rule text-xs font-editorial-label font-medium text-accent-2">
                      {repo.owner}/{repo.name}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {savedNews.length > 0 && (
            <section className="space-y-4">
              <h3 className="font-editorial-display text-lg sm:text-xl text-ink flex items-center gap-2 border-b border-rule pb-2.5 max-w-none">
                <Newspaper className="w-4 h-4 text-accent-hi shrink-0" />
                <span>ข่าวสาร AI Lab ที่คั่นไว้ ({savedNews.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedNews.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => onOpenNews(article)}
                    className="repo-card group cursor-pointer p-5 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent-2 transition-colors leading-snug">
                          {article.hook_headline}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => onRemoveNews(article, e)}
                          className="relative z-10 text-xs font-editorial-label text-muted hover:text-accent-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          ลบออก
                        </button>
                      </div>
                      <p className="text-sm font-editorial-body text-ink-2/90 line-clamp-2">
                        {article.short_teaser}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-rule text-xs font-editorial-label text-accent-2 font-medium">
                      {article.category}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
